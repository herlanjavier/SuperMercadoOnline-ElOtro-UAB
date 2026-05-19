export const OPERATIONAL_TRANSITIONS = {
  pending_payment: ['cancelled'],
  confirmed: ['ready_for_pickup', 'cancelled'],
  ready_for_pickup: ['delivered', 'cancelled'],
};

export const canTransitionOrderStatus = (currentStatus, nextStatus) => {
  if (currentStatus === 'delivered' || currentStatus === 'cancelled') return false;
  if (currentStatus === 'pending_payment' && nextStatus === 'confirmed') return false;
  return OPERATIONAL_TRANSITIONS[currentStatus]?.includes(nextStatus) || false;
};
