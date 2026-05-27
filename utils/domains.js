export function normalizeDomain(raw) {
  let v = String(raw || '').trim().toLowerCase();
  if (!v) return null;
  v = v.replace(/^https?:\/\//, '');
  v = v.split('/')[0];
  v = v.split('?')[0];
  v = v.split('#')[0];
  v = v.replace(/^www\./, '');
  v = v.split(':')[0];
  if (!isValidDomain(v)) return null;
  return v;
}

export function isValidDomain(domain) {
  if (!domain || domain.length < 4 || domain.length > 253) return false;
  if (!domain.includes('.')) return false;
  if (!/^[a-z0-9.-]+$/.test(domain)) return false;
  if (domain.startsWith('-') || domain.endsWith('-')) return false;
  if (domain.startsWith('.') || domain.endsWith('.')) return false;
  const labels = domain.split('.');
  if (labels.length < 2) return false;
  for (const label of labels) {
    if (label.length === 0 || label.length > 63) return false;
    if (label.startsWith('-') || label.endsWith('-')) return false;
  }
  return true;
}

function escapeForRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildDomainRegex(domain) {
  const escaped = escapeForRegex(domain);
  return `^https?://(?:[^/]*\\.)?${escaped}(?:[/?#:].*)?$`;
}
