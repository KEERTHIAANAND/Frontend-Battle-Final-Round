export function formatCurrency(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.max(0, val));
}

export function formatROI(val: number): string {
  if (isNaN(val) || val === null) return '0.00%';
  return (Math.round(val * 100) / 100).toFixed(2) + '%';
}

export function formatNumber(val: number): string {
  if (isNaN(val)) return '0';
  return Math.round(val).toLocaleString('en-US');
}

export function formatDate(val: string): string {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

// KPI Strip compact formatting
export function formatCompactCurrency(val: number): string {
  if (!Number.isFinite(val)) return '$0';
  if (Math.abs(val) >= 1_000_000_000) {
    return `$${(val / 1_000_000_000).toFixed(1)}B`;
  }
  if (Math.abs(val) >= 1_000_000) {
    return `$${(val / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(val) >= 1_000) {
    return `$${(val / 1_000).toFixed(1)}K`;
  }
  return `$${Math.round(val)}`;
}

export function formatCompactNumber(val: number): string {
  if (!Number.isFinite(val)) return '0';
  if (Math.abs(val) >= 1_000_000_000) {
    return `${(val / 1_000_000_000).toFixed(1)}B`;
  }
  if (Math.abs(val) >= 1_000_000) {
    return `${(val / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(val) >= 1_000) {
    return `${(val / 1_000).toFixed(1)}K`;
  }
  return `${Math.round(val)}`;
}
