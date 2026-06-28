'use client';

import { useState, useRef, useEffect } from 'react';
import Topbar, { type TopbarHandle } from '@/components/layout/Topbar';
import PanelToggleBar, { type PanelToggleBarHandle } from '@/components/layout/PanelToggleBar';
import KpiStrip, { type KpiStripHandle } from '@/components/kpi/KpiStrip';
import VirtualGrid, { type VirtualGridHandle } from '@/components/grid/VirtualGrid';
import FilterPanel, { type FilterPanelHandle, type FilterState } from '@/components/filters/FilterPanel';
import AnalyticsChart, { type AnalyticsChartHandle } from '@/components/analytics/AnalyticsChart';

import { streamController } from '@/lib/streamController';
import { stateEngine, type KpiSnapshot } from '@/lib/stateEngine';
import type { RpaRow } from '@/types/rpa';
import type { SortConfig } from '@/components/grid/SortHeaderCell';
import { loadPanelVisibility, togglePanel, resetPanels, type PanelKey, type PanelVisibility } from '@/lib/layoutPersistence';
import { inspectorController } from '@/lib/inspectorController';
import InspectorPanel from '@/components/inspector/InspectorPanel';

export default function WorkspaceLayout() {
  const [panelVisibility, setPanelVisibility] = useState<PanelVisibility>({
    kpiStrip: true,
    filterPanel: true,
    dataGrid: true,
    analyticsChart: false
  });
  const [isPausedUI, setIsPausedUI] = useState(false);

  // All refs
  const topbarRef = useRef<TopbarHandle>(null);
  const panelToggleRef = useRef<PanelToggleBarHandle>(null);
  const kpiStripRef = useRef<KpiStripHandle>(null);
  const filterPanelRef = useRef<FilterPanelHandle>(null);
  const virtualGridRef = useRef<VirtualGridHandle>(null);
  const analyticsRef = useRef<AnalyticsChartHandle>(null);

  useEffect(() => {
    // 1. Load persisted layout
    setPanelVisibility(loadPanelVisibility());

    // 2. Populate filter dropdowns after 1500ms (enough data collected)
    const populateTimer = setTimeout(() => {
      filterPanelRef.current?.populateOptions({
        automation_type: stateEngine.getUniqueValues('automation_type'),
        department: stateEngine.getUniqueValues('department'),
        industry: stateEngine.getUniqueValues('industry')
      });
    }, 1500);

    // 3. Wire stream controller
    streamController.initialize(
      // renderCallback — called on every RAF tick (max 60fps)
      (viewPool: RpaRow[]) => {
        virtualGridRef.current?.updateGrid(viewPool);
        analyticsRef.current?.update(viewPool);
        panelToggleRef.current?.updateRowCount(viewPool.length, stateEngine.masterPool.size);
      },
      // kpiCallback
      (kpi: KpiSnapshot) => {
        kpiStripRef.current?.updateKpi(kpi);
      }
    );

    // 4. Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        filterPanelRef.current?.focusSearch();
      }
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        handlePausePlay();
      }
      if (e.key === 'Escape') {
        // Close inspector first if open — don't propagate to filter clear
        if (inspectorController.open) {
          inspectorController.closeInspector();
          document.querySelectorAll('.row-selected')
            .forEach(el => el.classList.remove('row-selected'));
          return;
        }
        streamController.updateViewConfig({ filters: {}, searchTokens: [] });
        filterPanelRef.current?.clearAll();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(populateTimer);
      document.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Keep topbar visuals in sync with queue length if paused
    if (!isPausedUI) return;
    const interval = setInterval(() => {
      topbarRef.current?.setPauseVisuals(true, streamController.queueLength);
    }, 200);
    return () => clearInterval(interval);
  }, [isPausedUI]);

  const handleTogglePanel = (key: PanelKey) => {
    setPanelVisibility(prev => togglePanel(prev, key));
  };

  const handlePausePlay = () => {
    if (streamController.paused) {
      streamController.play();
      setIsPausedUI(false);
      topbarRef.current?.setPauseVisuals(false, 0);
    } else {
      streamController.pause();
      setIsPausedUI(true);
      topbarRef.current?.setPauseVisuals(true, streamController.queueLength);
    }
  };

  const handleSortChange = (sorts: SortConfig[]) => {
    streamController.updateViewConfig({ sorts });
  };

  const handleFilterChange = (filters: FilterState) => {
    streamController.updateViewConfig({ filters });
  };

  const handleSearchChange = (tokens: string[]) => {
    streamController.updateViewConfig({ searchTokens: tokens });
  };

  const handleReset = () => {
    setPanelVisibility(resetPanels());
  };

  return (
    <div className={isPausedUI ? 'stream-disconnected' : ''} style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-terminal)', overflow: 'hidden' }}>
      <Topbar ref={topbarRef} isPaused={isPausedUI} onPausePlay={handlePausePlay} />
      
      <PanelToggleBar ref={panelToggleRef} visibility={panelVisibility as any} onToggle={handleTogglePanel as any} onReset={handleReset} />
      
      {/* KPI Strip — slides out vertically when hidden */}
      <div className="panel-slide" data-visible={panelVisibility.kpiStrip}>
        <KpiStrip ref={kpiStripRef} />
      </div>
      
      {/* Main content area — horizontal split */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        
        {/* Filter sidebar — slides left when hidden */}
        <div className="panel-slide-horizontal" data-visible={panelVisibility.filterPanel}
             style={{ width: '260px', flexShrink: 0, borderRight: '0.5px solid var(--border-panel)' }}>
          <FilterPanel 
            ref={filterPanelRef} 
            onSearch={handleSearchChange} 
            onFilterChange={handleFilterChange} 
          />
        </div>
        
        {/* Grid takes remaining space */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <VirtualGrid ref={virtualGridRef} onSort={handleSortChange} />
        </div>
      </div>
      
      {/* Analytics panel — fixed height strip at bottom */}
      <div className="panel-slide" data-visible={panelVisibility.analyticsChart}
           style={{ borderTop: '0.5px solid var(--border-panel)' }}>
        <AnalyticsChart ref={analyticsRef} />
      </div>

      {/* Inspector portal mount — completely isolated from main app tree */}
      <div id="inspector-portal-root" />
      <InspectorPanel />
    </div>
  );
}
