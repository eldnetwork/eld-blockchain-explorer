export function normalizeAccountAddress(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    return `0x${trimmed.slice(2).toLowerCase()}`;
  }

  if (/^[a-fA-F0-9]{40}$/.test(trimmed)) {
    return `0x${trimmed.toLowerCase()}`;
  }

  return null;
}

export function isAccountHexAddress(value) {
  return normalizeAccountAddress(value) !== null;
}

