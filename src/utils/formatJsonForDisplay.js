const DEFAULT_INDENT = 2;
const DEFAULT_ITEMS_PER_LINE = 32;
const COMPACT_ARRAY_THRESHOLD = 8;

function isPrimitive(value) {
  return value === null || typeof value !== 'object';
}

function isPrimitiveArray(arr) {
  return Array.isArray(arr) && arr.length > 0 && arr.every(isPrimitive);
}

function pad(depth, indentSize) {
  return ' '.repeat(depth * indentSize);
}

function formatPrimitiveArray(arr, depth, indentSize, itemsPerLine) {
  const current = pad(depth, indentSize);
  const inner = pad(depth + 1, indentSize);

  if (arr.length <= COMPACT_ARRAY_THRESHOLD) {
    return `${current}[${arr.map((item) => JSON.stringify(item)).join(', ')}]`;
  }

  const lines = [`${current}[`];
  for (let i = 0; i < arr.length; i += itemsPerLine) {
    const chunk = arr.slice(i, i + itemsPerLine);
    const serialized = chunk.map((item) => JSON.stringify(item)).join(', ');
    const hasMore = i + itemsPerLine < arr.length;
    lines.push(`${inner}${serialized}${hasMore ? ',' : ''}`);
  }
  lines.push(`${current}]`);
  return lines.join('\n');
}

function formatValue(value, depth, indentSize, itemsPerLine) {
  if (isPrimitive(value)) {
    return `${pad(depth, indentSize)}${JSON.stringify(value)}`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${pad(depth, indentSize)}[]`;
    }

    if (isPrimitiveArray(value)) {
      return formatPrimitiveArray(value, depth, indentSize, itemsPerLine);
    }

    const current = pad(depth, indentSize);
    const childDepth = depth + 1;
    const items = value.map((item) => formatValue(item, childDepth, indentSize, itemsPerLine));
    return `${current}[\n${items.join(',\n')}\n${current}]`;
  }

  const entries = Object.entries(value);
  if (entries.length === 0) {
    return `${pad(depth, indentSize)}{}`;
  }

  const current = pad(depth, indentSize);
  const childDepth = depth + 1;
  const lines = entries.map(([key, entryValue]) => {
    const formatted = formatValue(entryValue, childDepth, indentSize, itemsPerLine);
    const keyPrefix = `${pad(childDepth, indentSize)}${JSON.stringify(key)}: `;

    if (!formatted.includes('\n')) {
      return keyPrefix + formatted.trimStart();
    }

    const valueLines = formatted.split('\n');
    const [firstLine, ...rest] = valueLines;
    const first = `${keyPrefix}${firstLine.trimStart()}`;
    const restIndented = rest
      .map((line) => `${pad(childDepth, indentSize)}${line.trimStart()}`)
      .join('\n');
    return restIndented ? `${first}\n${restIndented}` : first;
  });

  return `${current}{\n${lines.join(',\n')}\n${current}}`;
}

/**
 * Pretty-print JSON for explorer views. Object structure stays readable while
 * long primitive arrays (e.g. proof chunk_data) are grouped on fewer lines.
 *
 * @param {unknown} value
 * @param {{ indent?: number, itemsPerLine?: number }} [options]
 * @returns {string}
 */
export function formatJsonForDisplay(value, options = {}) {
  const indentSize = options.indent ?? DEFAULT_INDENT;
  const itemsPerLine = options.itemsPerLine ?? DEFAULT_ITEMS_PER_LINE;
  return formatValue(value, 0, indentSize, itemsPerLine).trimStart();
}
