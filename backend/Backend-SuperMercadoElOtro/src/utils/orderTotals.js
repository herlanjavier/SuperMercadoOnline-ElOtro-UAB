export const calculateItemSubtotal = ({ quantity, unitPrice }) => Number(quantity) * Number(unitPrice);

export const calculateOrderTotal = (items) =>
  items.reduce((total, item) => total + calculateItemSubtotal(item), 0);
