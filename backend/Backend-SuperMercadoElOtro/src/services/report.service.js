import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';
import { getStockStatus } from './product.service.js';
import { listSales } from './sale.service.js';

const startOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const endOfDay = (date) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

const formatDate = (date) => date.toISOString().slice(0, 10);

export const parseReportPeriod = (filters = {}) => {
  if (filters.date) {
    const day = new Date(`${filters.date}T00:00:00`);
    return {
      from: startOfDay(day).toISOString(),
      to: endOfDay(day).toISOString(),
      label: formatDate(day),
      hasExplicitDateFilter: true,
    };
  }

  if (filters.month) {
    const [year, month] = filters.month.split('-').map(Number);
    const from = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const to = new Date(year, month, 0, 23, 59, 59, 999);
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      label: filters.month,
      hasExplicitDateFilter: true,
    };
  }

  if (filters.from || filters.to) {
    const from = filters.from ? new Date(filters.from) : startOfDay(new Date());
    const to = filters.to ? new Date(filters.to) : endOfDay(new Date());
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      label: `${formatDate(from)} a ${formatDate(to)}`,
      hasExplicitDateFilter: true,
    };
  }

  const today = new Date();
  return {
    from: startOfDay(today).toISOString(),
    to: endOfDay(today).toISOString(),
    label: formatDate(today),
    hasExplicitDateFilter: false,
  };
};

const getProductsByIds = async (ids) => {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const { data, error } = await supabaseAdmin.from('products').select('id, name').in('id', uniqueIds);

  if (error) throw new AppError(error.message, 400);
  return new Map(data.map((product) => [product.id, product]));
};

const getSuppliersByIds = async (ids) => {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const { data, error } = await supabaseAdmin.from('suppliers').select('id, name').in('id', uniqueIds);

  if (error) throw new AppError(error.message, 400);
  return new Map(data.map((supplier) => [supplier.id, supplier]));
};

const getProfilesByIds = async (ids) => {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, first_name, last_name, ci, phone')
    .in('id', uniqueIds);

  if (error) throw new AppError(error.message, 400);
  return new Map(data.map((profile) => [profile.id, profile]));
};

const mapProfile = (profile) =>
  profile
    ? {
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        ci: profile.ci,
        phone: profile.phone,
      }
    : null;

export const getSalesReport = async (filters) => {
  const period = parseReportPeriod(filters);
  const sales = await listSales({
    from: period.from,
    to: period.to,
    customerId: filters.customerId,
    soldBy: filters.soldBy,
  });

  return {
    reportType: 'sales',
    generatedAt: new Date().toISOString(),
    period: {
      from: period.from,
      to: period.to,
      label: period.label,
    },
    summary: {
      totalSalesCount: sales.length,
      totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
    },
    sales,
  };
};

const mapProduct = (product) => ({
  id: product.id,
  name: product.name,
  category: product.categories ? { id: product.categories.id, name: product.categories.name } : null,
  price: Number(product.price || 0),
  stock: product.stock || 0,
  minStock: product.min_stock || 0,
  criticalStock: product.critical_stock || 0,
  stockStatus: getStockStatus(product),
  expirationDate: product.expiration_date,
  isActive: product.is_active,
});

const mapInventoryEntry = (entry, context) => ({
  id: entry.id,
  product: context.products.get(entry.product_id) || null,
  supplier: context.suppliers.get(entry.supplier_id) || null,
  quantityReceived: entry.quantity_received,
  expectedQuantity: entry.expected_quantity,
  quantityDifference: entry.quantity_difference,
  totalCost: Number(entry.total_cost || 0),
  receivedAt: entry.received_at,
  registeredBy: mapProfile(context.profiles.get(entry.registered_by)),
  notes: entry.notes,
});

export const getInventoryReport = async (filters) => {
  const period = parseReportPeriod(filters);
  let productsQuery = supabaseAdmin.from('products').select('*, categories(id, name)').order('name', { ascending: true });

  if (!filters.includeInactive) productsQuery = productsQuery.eq('is_active', true);
  if (filters.categoryId) productsQuery = productsQuery.eq('category_id', filters.categoryId);

  const { data: rawProducts, error: productsError } = await productsQuery;
  if (productsError) throw new AppError(productsError.message, 400);

  let products = rawProducts.map(mapProduct);
  if (filters.stockStatus) products = products.filter((product) => product.stockStatus === filters.stockStatus);

  const summary = products.reduce(
    (acc, product) => {
      acc.totalProducts += 1;
      acc.totalCurrentStock += product.stock;
      acc.totalInventoryValue += product.stock * product.price;
      if (product.isActive) acc.activeProducts += 1;
      else acc.inactiveProducts += 1;
      if (product.stockStatus === 'out_of_stock') acc.outOfStockProducts += 1;
      if (product.stockStatus === 'low') acc.lowStockProducts += 1;
      if (product.stockStatus === 'critical') acc.criticalStockProducts += 1;
      if (product.stockStatus === 'normal') acc.normalStockProducts += 1;
      return acc;
    },
    {
      totalProducts: 0,
      activeProducts: 0,
      inactiveProducts: 0,
      totalCurrentStock: 0,
      totalInventoryValue: 0,
      outOfStockProducts: 0,
      lowStockProducts: 0,
      criticalStockProducts: 0,
      normalStockProducts: 0,
    },
  );

  let entriesQuery = supabaseAdmin
    .from('inventory_entries')
    .select('*')
    .order('received_at', { ascending: false });

  if (period.hasExplicitDateFilter) {
    entriesQuery = entriesQuery.gte('received_at', period.from).lte('received_at', period.to);
  } else {
    entriesQuery = entriesQuery.limit(20);
  }

  const { data: rawEntries, error: entriesError } = await entriesQuery;
  if (entriesError) throw new AppError(entriesError.message, 400);

  const context = {
    products: await getProductsByIds(rawEntries.map((entry) => entry.product_id)),
    suppliers: await getSuppliersByIds(rawEntries.map((entry) => entry.supplier_id)),
    profiles: await getProfilesByIds(rawEntries.map((entry) => entry.registered_by)),
  };

  return {
    reportType: 'inventory',
    generatedAt: new Date().toISOString(),
    period: {
      from: period.from,
      to: period.to,
      label: period.label,
    },
    summary,
    products,
    inventoryEntries: rawEntries.map((entry) => mapInventoryEntry(entry, context)),
  };
};

const countRows = async (table, buildQuery) => {
  let query = supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
  query = buildQuery ? buildQuery(query) : query;
  const { count, error } = await query;
  if (error) throw new AppError(error.message, 400);
  return count || 0;
};

export const getDashboardSummary = async () => {
  const today = parseReportPeriod({ date: formatDate(new Date()) });
  const month = parseReportPeriod({ month: new Date().toISOString().slice(0, 7) });
  const [todaySales, monthSales] = await Promise.all([getSalesReport({ from: today.from, to: today.to }), getSalesReport({ from: month.from, to: month.to })]);
  const { data: products, error: productsError } = await supabaseAdmin.from('products').select('*');
  if (productsError) throw new AppError(productsError.message, 400);

  const inventory = products.reduce(
    (acc, product) => {
      const status = getStockStatus(product);
      if (product.is_active) acc.activeProducts += 1;
      if (status === 'out_of_stock') acc.outOfStockProducts += 1;
      if (status === 'low') acc.lowStockProducts += 1;
      if (status === 'critical') acc.criticalStockProducts += 1;
      return acc;
    },
    { activeProducts: 0, lowStockProducts: 0, criticalStockProducts: 0, outOfStockProducts: 0 },
  );

  return {
    sales: {
      todaySalesCount: todaySales.summary.totalSalesCount,
      todayRevenue: todaySales.summary.totalRevenue,
      monthSalesCount: monthSales.summary.totalSalesCount,
      monthRevenue: monthSales.summary.totalRevenue,
    },
    orders: {
      pendingPayment: await countRows('orders', (query) => query.eq('status', 'pending_payment')),
      confirmed: await countRows('orders', (query) => query.eq('status', 'confirmed')),
      readyForPickup: await countRows('orders', (query) => query.eq('status', 'ready_for_pickup')),
      delivered: await countRows('orders', (query) => query.eq('status', 'delivered')),
      cancelled: await countRows('orders', (query) => query.eq('status', 'cancelled')),
    },
    inventory,
    users: {
      activeCustomers: await countRows('profiles', (query) => query.eq('role', 'customer').eq('is_active', true)),
    },
  };
};

export const getTopProductsReport = async (filters) => {
  const salesReport = await getSalesReport(filters);
  const products = new Map();

  for (const sale of salesReport.sales) {
    for (const item of sale.items) {
      const current = products.get(item.productId) || {
        productId: item.productId,
        productName: item.productName,
        totalQuantitySold: 0,
        totalRevenue: 0,
      };
      current.totalQuantitySold += item.quantity;
      current.totalRevenue += item.subtotal;
      products.set(item.productId, current);
    }
  }

  return {
    reportType: 'top_products',
    generatedAt: new Date().toISOString(),
    period: salesReport.period,
    products: [...products.values()]
      .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
      .slice(0, filters.limit),
  };
};

export const getSalesByDayReport = async (filters) => {
  const salesReport = await getSalesReport(filters);
  const days = new Map();

  for (const sale of salesReport.sales) {
    const date = sale.soldAt.slice(0, 10);
    const current = days.get(date) || { date, salesCount: 0, revenue: 0 };
    current.salesCount += 1;
    current.revenue += sale.total;
    days.set(date, current);
  }

  return {
    reportType: 'sales_by_day',
    generatedAt: new Date().toISOString(),
    period: salesReport.period,
    days: [...days.values()].sort((a, b) => a.date.localeCompare(b.date)),
  };
};
