'use client';

import { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import Topbar, { type TopbarHandle } from './Topbar';
import PanelToggleBar, { type PanelToggleBarHandle } from './PanelToggleBar';
import { type PanelKey, type PanelVisibility } from '@/lib/layoutPersistence';
import { streamController } from '@/lib/streamController';

/* Placeholder components for panels that are not yet built.
   You would normally import these from their respective files. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
const KpiStrip = forwardRef<HTMLDivElement, {}>((props, ref) => (
  <div ref={ref} />
));
KpiStrip.displayName = 'KpiStrip';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
const FilterPanel = forwardRef<HTMLDivElement, {}>((props, ref) => (
  <div ref={ref} />
));
FilterPanel.displayName = 'FilterPanel';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
const VirtualGrid = forwardRef<HTMLDivElement, {}>((props, ref) => (
  <div ref={ref} />
));
VirtualGrid.displayName = 'VirtualGrid';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
const AnalyticsChart = forwardRef<HTMLDivElement, {}>((props, ref) => (
  <div ref={ref} />
));
AnalyticsChart.displayName = 'AnalyticsChart';

const DEFAULT_VISIBILITY: PanelVisibility = {
  kpiStrip: true,
  dataGrid: true,
  filterPanel: true,
  analyticsChart: true,
};

export default function WorkspaceLayout({ children }: { children?: React.ReactNode }) {
  const [panelVisibility, setPanelVisibility] = useState<PanelVisibility>(DEFAULT_VISIBILITY);
  const [isPaused, setIsPaused] = useState(false);

  const topbarRef = useRef<TopbarHandle>(null);
  const toggleBarRef = useRef<PanelToggleBarHandle>(null);
  const kpiStripRef = useRef<HTMLDivElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const virtualGridRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load from local storage if exists
    try {
      const saved = localStorage.getItem('neuropulse_layout');
      if (saved) {
        setPanelVisibility(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to parse layout from localStorage', e);
    }
  }, []);

  const handleToggle = useCallback((key: PanelKey) => {
    setPanelVisibility((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('neuropulse_layout', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setPanelVisibility(DEFAULT_VISIBILITY);
    localStorage.setItem('neuropulse_layout', JSON.stringify(DEFAULT_VISIBILITY));
  }, []);

  const handlePausePlay = useCallback(() => {
    if (streamController.paused) {
      streamController.play();
      setIsPaused(false);
      topbarRef.current?.setPauseVisuals(false, 0);
    } else {
      streamController.pause();
      setIsPaused(true);
      topbarRef.current?.setPauseVisuals(true, streamController.queueLength);
    }
  }, []);

  // Set interval to update queue length if paused
  useEffect(() => {
    if (!isPaused) return;
    const interval = setInterval(() => {
      topbarRef.current?.setPauseVisuals(true, streamController.queueLength);
    }, 200);
    return () => clearInterval(interval);
  }, [isPaused]);


  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'var(--bg-terminal)',
        overflow: 'hidden',
      }}
    >
      <Topbar
        ref={topbarRef}
        isPaused={isPaused}
        onPausePlay={handlePausePlay}
        onExport={() => {}}
      />
      
      <PanelToggleBar
        ref={toggleBarRef}
        visibility={panelVisibility}
        onToggle={handleToggle}
        onReset={handleReset}
      />
      
      {/* KPI Strip — slides out vertically when hidden */}
      <div 
        className="panel-slide" 
        data-visible={panelVisibility.kpiStrip}
      >
        {children ? null : <KpiStrip ref={kpiStripRef} />}
      </div>
      
      {/* Main content area — horizontal split */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        
        {/* Filter sidebar — slides left when hidden */}
        <div 
          className="panel-slide-horizontal" 
          data-visible={panelVisibility.filterPanel}
          style={{
            width: '260px',
            flexShrink: 0,
            borderRight: '0.5px solid var(--border-panel)'
          }}
        >
          {children ? null : <FilterPanel ref={filterPanelRef} />}
        </div>
        
        {/* Grid takes remaining space */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          {children ? children : <VirtualGrid ref={virtualGridRef} />}
        </div>
      </div>
      
      {/* Analytics panel — fixed height strip at bottom */}
      <div 
        className="panel-slide" 
        data-visible={panelVisibility.analyticsChart}
        style={{
          borderTop: '0.5px solid var(--border-panel)'
        }}
      >
        {children ? null : <AnalyticsChart ref={analyticsRef} />}
      </div>
    </div>
  );
}
