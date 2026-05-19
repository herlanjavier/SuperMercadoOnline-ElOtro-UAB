export const getStockStatus = (product) => {
  const stock = product.stock ?? 0;
  const criticalStock = product.critical_stock ?? product.criticalStock ?? 0;
  const minStock = product.min_stock ?? product.minStock ?? 0;

  if (stock <= 0) return 'out_of_stock';
  if (stock <= criticalStock) return 'critical';
  if (stock <= minStock) return 'low';
  return 'normal';
};
