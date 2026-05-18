import { asyncHandler } from '../utils/asyncHandler.js';
import { getHealthStatus } from '../services/health.service.js';

export const getHealth = asyncHandler(async (_req, res) => {
  res.status(200).json(getHealthStatus());
});
