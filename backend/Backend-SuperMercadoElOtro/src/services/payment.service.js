import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { createOrUpdateLowStockNotification } from './inventory.service.js';
import { generateReceiptNumber } from './receipt.service.js';
import { getSaleByOrderId } from './sale.service.js';

const mapOrderPaymentSummary = (order) => ({
  id: order.id,
  status: order.status,
  confirmedBy: order.confirmed_by,
  confirmedAt: order.confirmed_at,
  total: Number(order.total),
  paymentProofPath: order.payment_proof_path,
  paymentProofMimeType: order.payment_proof_mime_type,
  paymentProofUploadedAt: order.payment_proof_uploaded_at,
});

const mapSalePaymentSummary = (sale) => ({
  id: sale.id,
  receiptNumber: sale.receipt_number,
  total: Number(sale.total),
});

const getOrderItems = async (orderId) => {
  const { data, error } = await supabaseAdmin.from('order_items').select('*').eq('order_id', orderId);

  if (error) throw new AppError(error.message, 400);
  if (data.length === 0) throw new AppError('El pedido no tiene items', 400);

  return data;
};

const getProductsForItems = async (items) => {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .in(
      'id',
      items.map((item) => item.product_id),
    );

  if (error) throw new AppError(error.message, 400);

  const products = new Map(data.map((product) => [product.id, product]));

  for (const item of items) {
    const product = products.get(item.product_id);

    if (!product) {
      throw new AppError('Producto no encontrado', 400);
    }

    if (product.stock < item.quantity) {
      throw new AppError(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}`, 400);
    }
  }

  return products;
};

const restoreStock = async (movements) => {
  for (const movement of movements.toReversed()) {
    await supabaseAdmin
      .from('products')
      .update({ stock: movement.previousStock })
      .eq('id', movement.productId);
  }
};

export const confirmQrPayment = async (orderId, confirmedBy, payload) => {
  const { data: order, error: orderError } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single();

  if (orderError || !order) throw new AppError('Pedido no encontrado', 404);

  if (order.status === 'confirmed') throw new AppError('El pedido ya fue confirmado', 400);
  if (order.status !== 'pending_payment') throw new AppError('El pedido no esta pendiente de pago', 400);
  if (!order.payment_proof_path) throw new AppError('El pedido aun no tiene comprobante de pago.', 400);

  const { data: existingSale } = await supabaseAdmin.from('sales').select('id').eq('order_id', orderId).maybeSingle();
  if (existingSale) throw new AppError('Este pedido ya tiene una venta registrada', 400);

  const items = await getOrderItems(orderId);
  const products = await getProductsForItems(items);
  const receiptNumber = await generateReceiptNumber();
  const stockMovements = [];
  let createdSale = null;

  try {
    for (const item of items) {
      const product = products.get(item.product_id);
      const newStock = product.stock - item.quantity;

      const { error: stockError } = await supabaseAdmin
        .from('products')
        .update({ stock: newStock })
        .eq('id', product.id);

      if (stockError) throw new AppError(stockError.message, 400);

      const updatedProduct = { ...product, stock: newStock };
      stockMovements.push({
        productId: product.id,
        productName: product.name,
        previousStock: product.stock,
        quantitySold: item.quantity,
        newStock,
      });

      await createOrUpdateLowStockNotification(updatedProduct);
    }

    const now = new Date().toISOString();

    const { data: updatedOrder, error: updateOrderError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'confirmed',
        confirmed_by: confirmedBy,
        confirmed_at: now,
        payment_notes: payload.notes ?? order.payment_notes ?? null,
      })
      .eq('id', orderId)
      .select('*')
      .single();

    if (updateOrderError || !updatedOrder) {
      throw new AppError(updateOrderError?.message || 'No se pudo confirmar el pedido', 400);
    }

    const { data: sale, error: saleError } = await supabaseAdmin
      .from('sales')
      .insert({
        order_id: orderId,
        customer_id: order.customer_id,
        total: order.total,
        sold_by: confirmedBy,
        sold_at: now,
        receipt_number: receiptNumber,
      })
      .select('*')
      .single();

    if (saleError || !sale) {
      throw new AppError(saleError?.message || 'No se pudo registrar la venta', 400);
    }

    createdSale = sale;

    const saleItems = items.map((item) => {
      const product = products.get(item.product_id);
      return {
        sale_id: sale.id,
        product_id: item.product_id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      };
    });

    const { error: saleItemsError } = await supabaseAdmin.from('sale_items').insert(saleItems);

    if (saleItemsError) {
      throw new AppError(saleItemsError.message, 400);
    }

    return {
      order: mapOrderPaymentSummary(updatedOrder),
      sale: mapSalePaymentSummary(sale),
      stockMovements,
    };
  } catch (error) {
    if (createdSale?.id) {
      await supabaseAdmin.from('sale_items').delete().eq('sale_id', createdSale.id);
      await supabaseAdmin.from('sales').delete().eq('id', createdSale.id);
    }

    await supabaseAdmin
      .from('orders')
      .update({
        status: order.status,
        confirmed_by: order.confirmed_by,
        confirmed_at: order.confirmed_at,
        payment_notes: order.payment_notes,
      })
      .eq('id', orderId);

    await restoreStock(stockMovements);
    throw error;
  }
};

export const getPaymentStatus = async (orderId, requester) => {
  const { data: order, error } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single();

  if (error || !order) throw new AppError('Pedido no encontrado', 404);

  if (requester.role === 'customer' && order.customer_id !== requester.id) {
    throw new AppError('No tienes permiso para ver este pedido', 403);
  }

  let sale = null;

  try {
    sale = await getSaleByOrderId(orderId, requester);
  } catch (saleError) {
    if (saleError.statusCode !== 404) throw saleError;
  }

  return {
    orderId: order.id,
    status: order.status,
    isPaid: ['confirmed', 'ready_for_pickup', 'delivered'].includes(order.status),
    confirmedAt: order.confirmed_at,
    total: Number(order.total),
    paymentProofPath: order.payment_proof_path,
    paymentProofMimeType: order.payment_proof_mime_type,
    paymentProofUploadedAt: order.payment_proof_uploaded_at,
    sale: sale
      ? {
          id: sale.id,
          receiptNumber: sale.receiptNumber,
          total: sale.total,
        }
      : null,
  };
};
