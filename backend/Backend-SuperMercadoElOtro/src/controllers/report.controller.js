import {
  getDashboardSummary,
  getInventoryReport,
  getSalesByDayReport,
  getSalesReport,
  getTopProductsReport,
} from '../services/report.service.js';
import { createInventoryReportPdf, createSalesReportPdf } from '../services/pdf.service.js';
import {
  inventoryReportQuerySchema,
  salesByDayQuerySchema,
  salesReportQuerySchema,
  topProductsQuerySchema,
} from '../validators/report.validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getSalesReportController = asyncHandler(async (req, res) => {
  const query = salesReportQuerySchema.parse(req.query);
  const data = await getSalesReport(query);
  res.status(200).json({ ok: true, data });
});

export const getSalesReportPdfController = asyncHandler(async (req, res) => {
  const query = salesReportQuerySchema.parse(req.query);
  const data = await getSalesReport(query);
  createSalesReportPdf(data, res);
});

export const getInventoryReportController = asyncHandler(async (req, res) => {
  const query = inventoryReportQuerySchema.parse(req.query);
  const data = await getInventoryReport(query);
  res.status(200).json({ ok: true, data });
});

export const getInventoryReportPdfController = asyncHandler(async (req, res) => {
  const query = inventoryReportQuerySchema.parse(req.query);
  const data = await getInventoryReport(query);
  createInventoryReportPdf(data, res);
});

export const getDashboardSummaryController = asyncHandler(async (_req, res) => {
  const data = await getDashboardSummary();
  res.status(200).json({ ok: true, data });
});

export const getTopProductsReportController = asyncHandler(async (req, res) => {
  const query = topProductsQuerySchema.parse(req.query);
  const data = await getTopProductsReport(query);
  res.status(200).json({ ok: true, data });
});

export const getSalesByDayReportController = asyncHandler(async (req, res) => {
  const query = salesByDayQuerySchema.parse(req.query);
  const data = await getSalesByDayReport(query);
  res.status(200).json({ ok: true, data });
});
