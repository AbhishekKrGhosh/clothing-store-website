export const money = (n, currency = '₹') =>
  `${currency}${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const hexToRgb = (hex = '#000000') => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

export const isLight = (hex = '#fff') => {
  const [r, g, b] = hexToRgb(hex).split(' ').map(Number);
  return (r * 299 + g * 587 + b * 114) / 1000 > 180;
};
