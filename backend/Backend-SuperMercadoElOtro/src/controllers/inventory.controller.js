import {
  createInventoryEntry,
  getInventoryEntryById,
  getInventorySummary,
  listInventoryEntries,
  listLowStockNotifications,
  listLowStockProducts,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../services/inventory.service.js';
import {
  createInventoryEntrySchema,
  inventoryEntryQuerySchema,
  lowStockQuerySchema,
  notificationQuerySchema,
} from '../validators/inventory.validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listInventoryEntriesController = asyncHandler(async (req, res) => {
  const query = inventoryEntryQuerySchema.parse(req.query);
  const data = await listInventoryEntries(query);
  res.status(200).json({ ok: true, data });
});

export const getInventoryEntryByIdController = asyncHandler(async (req, res) => {
  const data = await getInventoryEntryById(req.params.id);
  res.status(200).json({ ok: true, data });
});

export const createInventoryEntryController = asyncHandler(async (req, res) => {
  const payload = createInventoryEntrySchema.parse(req.body);
  const data = await createInventoryEntry(payload, req.user.id);
  res.status(201).json({ ok: true, data });
});

export const getInventorySummaryController = asyncHandler(async (_req, res) => {
  const data = await getInventorySummary();
  res.status(200).json({ ok: true, data });
});

export const listLowStockProductsController = asyncHandler(async (req, res) => {
  const query = lowStockQuerySchema.parse(req.query);
  const data = await listLowStockProducts(query);
  res.status(200).json({ ok: true, data });
});

export const listLowStockNotificationsController = asyncHandler(async (req, res) => {
  const query = notificationQuerySchema.parse(req.query);
  const data = await listLowStockNotifications(query);
  res.status(200).json({ ok: true, data });
});

export const markNotificationAsReadController = asyncHandler(async (req, res) => {
  const data = await markNotificationAsRead(req.params.id);
  res.status(200).json({ ok: true, data });
});

export const markAllNotificationsAsReadController = asyncHandler(async (_req, res) => {
  const data = await markAllNotificationsAsRead();
  res.status(200).json({ ok: true, data });
});
