import {
  addSupplierProducts,
  createSupplier,
  deactivateSupplier,
  getSupplierById,
  listSuppliers,
  removeSupplierProduct,
  restoreSupplier,
  updateSupplier,
} from '../services/supplier.service.js';
import {
  createSupplierSchema,
  supplierProductsSchema,
  supplierQuerySchema,
  updateSupplierSchema,
} from '../validators/supplier.validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listSuppliersController = asyncHandler(async (req, res) => {
  const query = supplierQuerySchema.parse(req.query);
  const data = await listSuppliers(query);
  res.status(200).json({ ok: true, data });
});

export const getSupplierByIdController = asyncHandler(async (req, res) => {
  const data = await getSupplierById(req.params.id);
  res.status(200).json({ ok: true, data });
});

export const createSupplierController = asyncHandler(async (req, res) => {
  const payload = createSupplierSchema.parse(req.body);
  const data = await createSupplier(payload);
  res.status(201).json({ ok: true, data });
});

export const updateSupplierController = asyncHandler(async (req, res) => {
  const payload = updateSupplierSchema.parse(req.body);
  const data = await updateSupplier(req.params.id, payload);
  res.status(200).json({ ok: true, data });
});

export const deactivateSupplierController = asyncHandler(async (req, res) => {
  const data = await deactivateSupplier(req.params.id);
  res.status(200).json({ ok: true, data });
});

export const restoreSupplierController = asyncHandler(async (req, res) => {
  const data = await restoreSupplier(req.params.id);
  res.status(200).json({ ok: true, data });
});

export const addSupplierProductsController = asyncHandler(async (req, res) => {
  const payload = supplierProductsSchema.parse(req.body);
  const data = await addSupplierProducts(req.params.id, payload.productIds);
  res.status(200).json({ ok: true, data });
});

export const removeSupplierProductController = asyncHandler(async (req, res) => {
  const data = await removeSupplierProduct(req.params.id, req.params.productId);
  res.status(200).json({ ok: true, data });
});
