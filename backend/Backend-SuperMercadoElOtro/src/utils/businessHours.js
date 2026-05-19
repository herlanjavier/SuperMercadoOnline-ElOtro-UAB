export const isBusinessOpenNow = ({ currentTime, opensAt, closesAt, isOpen }) => {
  if (!isOpen) return false;
  return currentTime >= opensAt && currentTime <= closesAt;
};
