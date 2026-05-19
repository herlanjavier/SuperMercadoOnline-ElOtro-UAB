import { getSaleById, getSaleByOrderId, getSaleReceipt, listSales } from '../services/sale.service.js';
import { createReceiptPdf } from '../services/pdf.service.js';
import { saleQuerySchema } from '../validators/sale.validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getRequester = (req) => ({
  id: req.user.id,
  role: req.profile.role,
});

export const listSalesController = asyncHandler(async (req, res) => {
  const query = saleQuerySchema.parse(req.query);
  const data = await listSales(query);

  res.status(200).json({ ok: true, data });
});

export const getSaleByIdController = asyncHandler(async (req, res) => {
  const data = await getSaleById(req.params.id, getRequester(req));

  res.status(200).json({ ok: true, data });
});

export const getSaleByOrderIdController = asyncHandler(async (req, res) => {
  const data = await getSaleByOrderId(req.params.orderId, getRequester(req));

  res.status(200).json({ ok: true, data });
});

export const getSaleReceiptController = asyncHandler(async (req, res) => {
  const data = await getSaleReceipt(req.params.id, getRequester(req));

  res.status(200).json({ ok: true, data });
});

export const getSaleReceiptPdfController = asyncHandler(async (req, res) => {
  const data = await getSaleReceipt(req.params.id, getRequester(req));

  createReceiptPdf(data, res);
});
