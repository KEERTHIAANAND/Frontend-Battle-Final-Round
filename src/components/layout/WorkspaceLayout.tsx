'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Topbar, { type TopbarHandle } from './Topbar';
import PanelToggleBar, { type PanelKey, type PanelVisibility, type PanelToggleBarHandle } from './PanelToggleBar';
import { streamController } from '@/lib/streamController';

/* Placeholder components for panels that are not yet built.
   You would normally import these from their respective files. */
const KpiStrip = forwardRef<HTMLDivElement, any>((props, ref) => (
  <div ref={ref} style={{ padding: 16, borderBottom: '0.5px solid var(--border-panel)' }}>KPI Strip Component</div>
));
KpiStrip.displayName = 'KpiStrip';

const FilterPanel = forwardRef<HTMLDivElement, any>((props, ref) => (
  <div ref={ref} style={{ padding: 16 }}>Filter Panel</div>
));
FilterPanel.displayName = 'FilterPanel';

const VirtualGrid = forwardRef<HTMLDivElement, any>((props, ref) => (
  <div ref={ref} style={{ padding: 16 }}>Data Grid Component</div>
));
VirtualGrid.displayName = 'VirtualGrid';

const AnalyticsChart = forwardRef<HTMLDivElement, any>((props, ref) => (
  <div ref={ref} style={{ padding: 16 }}>Analytics Chart Component</div>
));
AnalyticsChart.displayName = 'AnalyticsChart';

import { forwardRef } from 'react';

const DEFAULT_VISIBILITY: PanelVisibility = {
  kpiStrip: true,
  dataGrid: true,
  filters: true,
  analytics: true,
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
          data-visible={panelVisibility.filters}
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
        data-visible={panelVisibility.analytics}
        style={{
          borderTop: '0.5px solid var(--border-panel)'
        }}
      >
        {children ? null : <AnalyticsChart ref={analyticsRef} />}
      </div>
    </div>
  );
}
