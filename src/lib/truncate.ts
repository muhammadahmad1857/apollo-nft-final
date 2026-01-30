// Utility to truncate wallet addresses like 0xGFC...6578
export function truncateAddress(address?: string) {
  if (!address) return '';
  if (address.length <= 10) return address;
  return address.slice(0, 5) + '...' + address.slice(-4);
}