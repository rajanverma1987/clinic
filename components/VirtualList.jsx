'use client';

/**
 * Virtual list using react-window for long lists (patients, appointments).
 * Preserves scroll position and reduces DOM nodes.
 */

import { FixedSizeList as List } from 'react-window';

export function VirtualList({
  items = [],
  height = 400,
  itemHeight = 56,
  width = '100%',
  renderItem,
  overscanCount = 5,
  className = '',
}) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const Row = ({ index, style, data }) => {
    const item = data.items[index];
    return <div style={style}>{data.renderItem(item, index)}</div>;
  };

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width={width}
      overscanCount={overscanCount}
      className={className}
      itemData={{ items, renderItem }}
    >
      {Row}
    </List>
  );
}
