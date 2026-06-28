import { useRef } from 'react';
import type { RpaRow } from '@/types/rpa';
import { formatCurrency, formatNumber, formatROI } from '@/lib/formatters';

const ROW_HEIGHT = 40;       // px — FIXED, never read from DOM
const OVERSCAN = 5;          // extra rows above/below viewport for smooth scroll

export function useVirtualScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const rowEls = useRef<HTMLDivElement[]>([]);      // pre-allocated row DOM nodes
  const cellMap = useRef<Map<number, HTMLSpanElement[]>>(new Map()); // row index → cells
  const startIndexRef = useRef(0);
  const currentPoolRef = useRef<RpaRow[]>([]);
  const visibleCountRef = useRef(0);

  // Call once on mount to measure viewport and set visibleCount
  function initVirtualScroll() {
    const containerHeight = containerRef.current?.clientHeight ?? 600;
    visibleCountRef.current = Math.ceil(containerHeight / ROW_HEIGHT) + OVERSCAN * 2;
  }

  // THE CORE RENDER FUNCTION — called on scroll and on new data
  // This patches DOM text nodes. No React. No setState. Pure DOM.
  function updateGrid(pool: RpaRow[]) {
    performance.mark('vg-update-start');
    currentPoolRef.current = pool;
    const startIdx = startIndexRef.current;
    
    // Update spacer height (scroll track length)
    if (spacerRef.current) {
      spacerRef.current.style.height = pool.length * ROW_HEIGHT + 'px';
    }
    
    // Update each pre-allocated row node
    for (let i = 0; i < rowEls.current.length; i++) {
      const domRow = rowEls.current[i];
      if (!domRow) continue;
      
      const dataIdx = startIdx + i;
      const row = pool[dataIdx];
      
      if (!row) {
        domRow.style.opacity = '0';
        domRow.style.pointerEvents = 'none';
        continue;
      }
      
      // Position row (no layout read — we know ROW_HEIGHT)
      domRow.style.transform = `translateY(${dataIdx * ROW_HEIGHT}px)`;
      domRow.style.opacity = '1';
      domRow.style.pointerEvents = 'auto';
      
      // Alternating row color
      domRow.style.background = dataIdx % 2 === 0 
        ? 'var(--bg-row)' : 'var(--bg-row-alt)';
      
      // Patch each cell's textContent (NEVER innerHTML)
      const cells = cellMap.current.get(i);
      if (cells) {
        cells[0].textContent = row.project_id;
        cells[1].textContent = row.company_id;
        cells[2].textContent = row.project_name?.slice(0, 20) ?? '';
        cells[3].textContent = row.project_status;
        cells[4].textContent = row.automation_type;
        cells[5].textContent = String(row.robots_deployed);
        cells[6].textContent = formatCurrency(row.budget_usd);
        cells[7].textContent = formatCurrency(row.annual_savings_usd);
        cells[8].textContent = formatROI(row.roi_percent);
        cells[9].textContent = row.department;
        cells[10].textContent = row.country;
        cells[11].textContent = formatNumber(row.employee_hours_saved);
        
        // Status color class (switch textContent color only — no layout impact)
        const statusCell = cells[3];
        statusCell.className = 'vg-cell ' + getStatusClass(row.project_status);
        
        // ROI color
        cells[8].style.color = row.roi_percent < 0 
          ? 'var(--text-danger)' 
          : row.roi_percent > 200 ? 'var(--text-success)' : 'var(--text-secondary)';
      }
      
      // Alert flash (CSS animation, no layout impact)
      const isAlert = row.project_status === 'Failed' || row.roi_percent < 0;
      if (isAlert && !domRow.classList.contains('row-alert')) {
        domRow.classList.add('row-alert');
        domRow.addEventListener('animationend', () => {
          domRow.classList.remove('row-alert');
        }, { once: true });
      }
    }
    performance.mark('vg-update-end');
    performance.measure('VG Update', 'vg-update-start', 'vg-update-end');
  }

  // Scroll handler — attached via addEventListener (NOT React onScroll)
  function handleScroll() {
    const scrollTop = containerRef.current?.scrollTop ?? 0;
    const newStart = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    if (newStart !== startIndexRef.current) {
      startIndexRef.current = newStart;
      updateGrid(currentPoolRef.current);
    }
  }

  return { containerRef, spacerRef, rowEls, cellMap, 
           initVirtualScroll, updateGrid, handleScroll, visibleCountRef,
           currentPoolRef, startIndexRef };
}

function getStatusClass(status: string): string {
  const map: Record<string, string> = { 
    Active: 'status-active', 
    Completed: 'status-completed', 
    Planned: 'status-planned', 
    Failed: 'status-failed' 
  };
  return map[status] ?? 'status-unknown';
}
