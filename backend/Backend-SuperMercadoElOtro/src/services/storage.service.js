import crypto from 'node:crypto';
import path from 'node:path';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';

const extensionByMime = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const paymentProofExtensionByMime = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

const allowedPaymentProofExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

export const buildPublicUrl = (filePath) => {
  const { data } = supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
};

export const uploadProductImage = async (file) => {
  if (!file) return null;

  const extension = extensionByMime[file.mimetype] || path.extname(file.originalname);
  const filePath = `products/${Date.now()}-${crypto.randomUUID()}${extension}`;

  const { error } = await supabaseAdmin.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new AppError(error.message, 400);
  }

  return {
    path: filePath,
    publicUrl: buildPublicUrl(filePath),
  };
};

export const deleteProductImage = async (filePath) => {
  if (!filePath) return;

  const { error } = await supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET).remove([filePath]);

  if (error) {
    throw new AppError(error.message, 400);
  }
};

export const uploadPaymentProof = async (file, orderId) => {
  if (!file) {
    throw new AppError('Selecciona un comprobante de pago.', 400);
  }

  const extension = paymentProofExtensionByMime[file.mimetype];
  const originalExtension = path.extname(file.originalname || '').toLowerCase();

  if (!extension || !allowedPaymentProofExtensions.includes(originalExtension)) {
    throw new AppError('El archivo debe ser imagen o PDF.', 400);
  }

  const filePath = `orders/${orderId}/proof-${Date.now()}${extension}`;

  const { error } = await supabaseAdmin.storage
    .from(env.SUPABASE_PAYMENT_PROOFS_BUCKET)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new AppError(error.message, 400);
  }

  return {
    path: filePath,
    mimeType: file.mimetype,
  };
};

export const deletePaymentProof = async (filePath) => {
  if (!filePath) return;

  const { error } = await supabaseAdmin.storage.from(env.SUPABASE_PAYMENT_PROOFS_BUCKET).remove([filePath]);

  if (error) {
    throw new AppError(error.message, 400);
  }
};

export const createSignedUrlForPaymentProof = async (filePath) => {
  if (!filePath) {
    throw new AppError('El pedido aun no tiene comprobante de pago.', 400);
  }

  const { data, error } = await supabaseAdmin.storage
    .from(env.SUPABASE_PAYMENT_PROOFS_BUCKET)
    .createSignedUrl(filePath, 10 * 60);

  if (error || !data?.signedUrl) {
    throw new AppError(error?.message || 'No se pudo abrir el comprobante.', 400);
  }

  return data.signedUrl;
};
