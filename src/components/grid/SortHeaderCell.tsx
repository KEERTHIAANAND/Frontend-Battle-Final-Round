import React from 'react';

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
  priority?: number;
}

interface SortHeaderCellProps {
  col: {
    key: string;
    label: string;
    width: number;
    sortable: boolean;
    multiSort?: boolean;
  };
  currentSorts: SortConfig[];
  onSort: (col: string, isShift: boolean) => void;
}

export function SortHeaderCell({ col, currentSorts, onSort }: SortHeaderCellProps) {
  const sort = currentSorts.find(s => s.column === col.key);
  const isActive = !!sort;
  const isAsc = sort?.direction === 'asc';
  
  // Only show priority badge if this column is sorted and there are multiple active sorts
  const showPriority = isActive && currentSorts.length > 1 && sort.priority !== undefined;

  return (
    <div
      onClick={(e) => {
        if (!col.sortable) return;
        onSort(col.key, e.shiftKey);
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '36px',
        padding: '0 12px',
        width: `${col.width}px`,
        minWidth: `${col.width}px`,
        flex: (col as any).flex || 'none',
        cursor: col.sortable ? 'pointer' : 'default',
        userSelect: 'none',
        fontFamily: 'var(--font-sans)',
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: isActive ? 'var(--text-accent)' : 'var(--text-muted)',
        borderBottom: isActive ? '2px solid var(--text-accent)' : '2px solid transparent',
        transition: 'background 150ms ease-out',
        position: 'relative',
        boxSizing: 'border-box'
      }}
      onMouseEnter={(e) => {
        if (col.sortable) {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
        }
      }}
      onMouseLeave={(e) => {
        if (col.sortable) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
        {col.label}
      </span>
      
      {isActive && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px', flexShrink: 0 }}>
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 24 24" 
            fill="none" 
            style={{
              transition: 'transform 150ms ease-out',
              transform: isAsc ? 'rotate(0deg)' : 'rotate(180deg)',
              stroke: 'currentColor',
              strokeWidth: '2',
              strokeLinecap: 'round',
              strokeLinejoin: 'round'
            }}
          >
            <path d="M7 14L12 9L17 14" />
          </svg>
          
          {showPriority && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: 'rgba(255,200,1,0.15)',
              color: 'var(--text-warning)',
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              fontWeight: 600,
            }}>
              {sort.priority}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
