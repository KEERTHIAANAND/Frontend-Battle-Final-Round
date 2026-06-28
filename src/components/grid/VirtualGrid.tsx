'use client'

import { forwardRef, useImperativeHandle, useEffect, useRef, useState } from 'react';
import type { RpaRow } from '@/types/rpa';
import { useVirtualScroll } from './useVirtualScroll';
import { SortHeaderCell, type SortConfig } from './SortHeaderCell';
import { streamController } from '@/lib/streamController';
import { inspectorController } from '@/lib/inspectorController';

const COLUMNS = [
  { key: 'project_id',          label: 'Project ID',      width: 100, sortable: false },
  { key: 'company_id',          label: 'Company',         width: 90,  sortable: false },
  { key: 'project_name',        label: 'Project Name',    width: 160, sortable: false, flex: 1 },
  { key: 'project_status',      label: 'Status',          width: 90,  sortable: false },
  { key: 'automation_type',     label: 'Type',            width: 140, sortable: false, flex: 1 },
  { key: 'robots_deployed',     label: 'Robots',          width: 70,  sortable: false },
  { key: 'budget_usd',          label: 'Budget',          width: 110, sortable: true, multiSort: true },
  { key: 'annual_savings_usd',  label: 'Savings',         width: 110, sortable: true, multiSort: true },
  { key: 'roi_percent',         label: 'ROI %',           width: 80,  sortable: true, multiSort: true },
  { key: 'department',          label: 'Department',      width: 130, sortable: false, multiSort: true, flex: 1 },
  { key: 'country',             label: 'Country',         width: 100, sortable: false, multiSort: true },
  { key: 'employee_hours_saved',label: 'Hours Saved',     width: 100, sortable: true, multiSort: true },
];

const ROW_HEIGHT = 40;

interface VirtualGridProps {
  onSort?: (sorts: SortConfig[]) => void;
}

export interface VirtualGridHandle {
  updateGrid: (pool: RpaRow[]) => void;
}

/* ── Pause-to-inspect hint (injected into DOM, auto-removed) ── */
function showPauseHint(x: number, y: number): void {
  const hint = document.createElement('div');
  hint.textContent = '⏸ Pause to inspect';
  hint.style.cssText = `
    position: fixed;
    left: ${x + 12}px;
    top: ${y - 10}px;
    background: rgba(13,17,23,0.95);
    border: 0.5px solid rgba(255,200,1,0.4);
    color: #FFC801;
    font-size: 11px;
    font-family: var(--font-mono);
    padding: 5px 10px;
    border-radius: 6px;
    pointer-events: none;
    z-index: 9999;
    opacity: 0;
    transition: opacity 100ms ease-out;
  `;
  document.body.appendChild(hint);
  requestAnimationFrame(() => { hint.style.opacity = '1'; });
  setTimeout(() => {
    hint.style.opacity = '0';
    hint.addEventListener('transitionend', () => hint.remove(), { once: true });
  }, 1200);
}

const VirtualGrid = forwardRef<VirtualGridHandle, VirtualGridProps>(
  function VirtualGrid({ onSort }, ref) {
    const { 
      containerRef, 
      spacerRef, 
      rowEls, 
      cellMap, 
      initVirtualScroll, 
      updateGrid, 
      handleScroll, 
      visibleCountRef,
      currentPoolRef,
      startIndexRef 
    } = useVirtualScroll();
    
    const gridBodyRef = useRef<HTMLDivElement>(null);
    const [sorts, setSorts] = useState<SortConfig[]>([]);
    const sortsRef = useRef<SortConfig[]>([]);
    
    const [showHint, setShowHint] = useState(false);
    const hideHintTimeout = useRef<NodeJS.Timeout>();

    useImperativeHandle(ref, () => ({
      updateGrid(pool: RpaRow[]) {
        updateGrid(pool);
        // Toggle empty state visibility
        const emptyState = containerRef.current?.parentElement?.querySelector('.vg-empty') as HTMLElement;
        if (emptyState) {
          emptyState.style.display = pool.length === 0 ? 'flex' : 'none';
        }
      }
    }));

    useEffect(() => {
      // 1. Call initVirtualScroll() to measure container
      initVirtualScroll();

      // 2. Pre-allocate visible row nodes and append to container
      for (let i = 0; i < visibleCountRef.current; i++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'vg-row';
        rowDiv.style.position = 'absolute';
        rowDiv.style.height = ROW_HEIGHT + 'px';
        rowDiv.style.width = '100%';
        rowDiv.style.willChange = 'transform';
        rowDiv.style.display = 'flex';
        rowDiv.style.alignItems = 'center';
        
        const cells: HTMLSpanElement[] = [];
        COLUMNS.forEach(col => {
          const cell = document.createElement('span');
          cell.className = 'vg-cell';
          cell.style.width = col.width + 'px';
          cell.style.minWidth = col.width + 'px';
          if ((col as any).flex) cell.style.flex = (col as any).flex.toString();
          cell.style.overflow = 'hidden';
          cell.style.textOverflow = 'ellipsis';
          cell.style.whiteSpace = 'nowrap';
          cell.style.padding = '0 12px';
          cell.style.fontSize = '12px';
          cell.style.fontFamily = 'var(--font-mono)';
          cell.style.color = 'var(--text-secondary)';
          cell.style.boxSizing = 'border-box';
          rowDiv.appendChild(cell);
          cells.push(cell);
        });
        
        rowEls.current[i] = rowDiv;
        cellMap.current.set(i, cells);
        gridBodyRef.current?.appendChild(rowDiv);
      }

      // 3. Attach scroll listener
      const container = containerRef.current;
      container?.addEventListener('scroll', handleScroll, { passive: true });

      // 4. Row click handler — event delegation on the grid body (ONE listener)
      const gridBody = gridBodyRef.current;

      const handleGridClick = (e: MouseEvent) => {
        // Only handle clicks when stream is PAUSED
        if (!streamController.paused) {
          showPauseHint(e.clientX, e.clientY);
          return;
        }

        // Walk up from click target to find .vg-row
        let target = e.target as HTMLElement | null;
        while (target && !target.classList.contains('vg-row')) {
          target = target.parentElement;
        }
        if (!target) return;

        // Find which pre-allocated row was clicked
        const rowIndex = rowEls.current.indexOf(target as HTMLDivElement);
        if (rowIndex === -1) return;

        const dataIndex = startIndexRef.current + rowIndex;
        const clickedRow = currentPoolRef.current[dataIndex];
        if (!clickedRow) return;

        // Clear previous selection
        document.querySelectorAll('.row-selected').forEach(el => el.classList.remove('row-selected'));

        // Open inspector with the full row object from memory
        inspectorController.openInspector(clickedRow);

        // Visual feedback: highlight clicked row
        target.classList.add('row-selected');
      };

      const handleGridMouseMove = () => {
        if (containerRef.current) {
          containerRef.current.style.cursor = streamController.paused ? 'pointer' : 'default';
        }
      };

      gridBody?.addEventListener('click', handleGridClick);
      gridBody?.addEventListener('mousemove', handleGridMouseMove, { passive: true });

      return () => {
        container?.removeEventListener('scroll', handleScroll);
        gridBody?.removeEventListener('click', handleGridClick);
        gridBody?.removeEventListener('mousemove', handleGridMouseMove);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleSortClick(col: string, isShift: boolean) {
      if (isShift) {
        setShowHint(true);
        if (hideHintTimeout.current) clearTimeout(hideHintTimeout.current);
        hideHintTimeout.current = setTimeout(() => setShowHint(false), 2000);
      }
      
      const current = sortsRef.current;
      const existing = current.find(s => s.column === col);
      
      let newSorts: SortConfig[];
      if (!isShift) {
        // Single sort — replace all
        if (existing && current.length === 1) {
          newSorts = [{ ...existing, direction: existing.direction === 'asc' ? 'desc' : 'asc', priority: 1 }];
        } else {
          newSorts = [{ column: col, direction: 'asc', priority: 1 }];
        }
      } else {
        // Multi-sort — add or toggle
        if (existing) {
          newSorts = current.map(s => s.column === col 
            ? { ...s, direction: s.direction === 'asc' ? 'desc' : 'asc' }
            : s
          );
        } else {
          newSorts = [...current, { column: col, direction: 'asc', priority: current.length + 1 }];
        }
      }
      
      sortsRef.current = newSorts;
      setSorts(newSorts); // Trigger render for headers only
      onSort?.(newSorts);
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
        
        {/* Sticky column headers */}
        <div className="vg-header" style={{
          display: 'flex', 
          height: '36px', 
          background: 'var(--bg-panel)',
          borderBottom: '1px solid var(--border-panel)', 
          position: 'sticky', 
          top: 0, 
          zIndex: 10, 
          flexShrink: 0
        }}>
          {COLUMNS.map(col => (
            <SortHeaderCell 
              key={col.key} 
              col={col} 
              currentSorts={sorts} 
              onSort={handleSortClick} 
            />
          ))}
        </div>
        
        {/* Shift Multi-sort Hint Tooltip */}
        <div style={{
          position: 'absolute',
          top: '46px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.8)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-sans)',
          fontSize: '11px',
          padding: '4px 10px',
          borderRadius: '4px',
          border: '1px solid var(--border-panel)',
          zIndex: 20,
          pointerEvents: 'none',
          opacity: showHint ? 1 : 0,
          transition: 'opacity 200ms ease-out',
        }}>
          Shift+click to multi-sort
        </div>
        
        {/* Scroll container */}
        <div ref={containerRef} className="vg-container" style={{
          flex: 1, 
          overflowY: 'scroll', 
          overflowX: 'auto', 
          position: 'relative',
          contain: 'strict', 
          background: 'var(--bg-terminal)'
        }}>
          
          {/* Spacer sets total scrollable height */}
          <div ref={spacerRef} style={{
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            pointerEvents: 'none'
          }} />
          
          {/* Grid body — rows are appended here imperatively on mount */}
          <div ref={gridBodyRef} style={{ position: 'relative' }} />
        </div>
        
        {/* Empty state */}
        <div className="vg-empty" style={{
          display: 'none', 
          position: 'absolute', 
          inset: 0, 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column', 
          gap: '12px', 
          color: 'var(--text-muted)'
        }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="8" y="8" width="32" height="32" rx="4" 
                  stroke="currentColor" strokeWidth="1.5"/>
            <line x1="16" y1="20" x2="32" y2="20" 
                  stroke="currentColor" strokeWidth="1.5"/>
            <line x1="16" y1="28" x2="24" y2="28" 
                  stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          <span style={{ fontSize: '13px', fontFamily: 'var(--font-sans)' }}>No matching projects</span>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-sans)' }}>Adjust your filters or search query</span>
        </div>
      </div>
    );
  }
);

export default VirtualGrid;
