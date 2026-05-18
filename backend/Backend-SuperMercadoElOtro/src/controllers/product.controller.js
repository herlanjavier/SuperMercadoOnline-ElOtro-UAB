import {
  createProduct,
  deactivateProduct,
  getProductById,
  listProducts,
  removeProductImage,
  restoreProduct,
  updateProduct,
} from '../services/product.service.js';
import {
  createProductSchema,
  productQuerySchema,
  updateProductSchema,
} from '../validators/product.validators.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listProductsController = asyncHandler(async (req, res) => {
  const filters = productQuerySchema.parse(req.query);
  const data = await listProducts(filters, req.profile);

  res.status(200).json({ ok: true, data });
});

export const getProductByIdController = asyncHandler(async (req, res) => {
  const data = await getProductById(req.params.id, req.profile);

  res.status(200).json({ ok: true, data });
});

export const createProductController = asyncHandler(async (req, res) => {
  const payload = createProductSchema.parse(req.body);
  const data = await createProduct(payload, req.file);

  res.status(201).json({ ok: true, data });
});

export const updateProductController = asyncHandler(async (req, res) => {
  const payload = updateProductSchema.parse(req.body);

  if (Object.keys(payload).length === 0 && !req.file) {
    throw new AppError('Debes enviar al menos un campo o una imagen para actualizar', 400);
  }

  const data = await updateProduct(req.params.id, payload, req.file);

  res.status(200).json({ ok: true, data });
});

export const deactivateProductController = asyncHandler(async (req, res) => {
  const data = await deactivateProduct(req.params.id);

  res.status(200).json({ ok: true, data });
});

export const restoreProductController = asyncHandler(async (req, res) => {
  const data = await restoreProduct(req.params.id);

  res.status(200).json({ ok: true, data });
});

export const removeProductImageController = asyncHandler(async (req, res) => {
  const data = await removeProductImage(req.params.id);

  res.status(200).json({ ok: true, data });
});
