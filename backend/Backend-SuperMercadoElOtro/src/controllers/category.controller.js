import {
  createCategory,
  deactivateCategory,
  listCategories,
  updateCategory,
} from '../services/category.service.js';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listCategoriesController = asyncHandler(async (req, res) => {
  const data = await listCategories({ includeInactive: req.query.includeInactive === 'true' }, req.profile);

  res.status(200).json({ ok: true, data });
});

export const createCategoryController = asyncHandler(async (req, res) => {
  const payload = createCategorySchema.parse(req.body);
  const data = await createCategory(payload);

  res.status(201).json({ ok: true, data });
});

export const updateCategoryController = asyncHandler(async (req, res) => {
  const payload = updateCategorySchema.parse(req.body);
  const data = await updateCategory(req.params.id, payload);

  res.status(200).json({ ok: true, data });
});

export const deactivateCategoryController = asyncHandler(async (req, res) => {
  const data = await deactivateCategory(req.params.id);

  res.status(200).json({ ok: true, data });
});
