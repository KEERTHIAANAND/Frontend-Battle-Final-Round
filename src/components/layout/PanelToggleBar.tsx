'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { type PanelKey, type PanelVisibility } from '@/lib/layoutPersistence';

export interface PanelToggleBarHandle {
  updateRowCount(visible: number, total: number): void;
}

interface PanelToggleBarProps {
  visibility: PanelVisibility;
  onToggle: (key: PanelKey) => void;
  onReset: () => void;
}

const PanelToggleBar = forwardRef<PanelToggleBarHandle, PanelToggleBarProps>(
  function PanelToggleBar({ visibility, onToggle, onReset }, ref) {
    const rowCountRef = useRef<HTMLSpanElement>(null);

    useImperativeHandle(ref, () => ({
      updateRowCount(visible: number, total: number) {
        if (rowCountRef.current) {
          rowCountRef.current.textContent = `Showing ${visible.toLocaleString()} / ${total.toLocaleString()} rows`;
        }
      },
    }));

    const barStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      height: 40,
      background: 'var(--bg-panel)',
      borderBottom: '0.5px solid var(--border-panel)',
      padding: '0 16px',
      gap: 8,
      flexShrink: 0,
    };

    const labelStyle: React.CSSProperties = {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      marginRight: 4,
    };

    const getBtnStyle = (isActive: boolean): React.CSSProperties => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 12px',
      borderRadius: 99,
      fontSize: 11,
      fontFamily: 'var(--font-sans)',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'background 150ms ease-out, border-color 150ms ease-out, color 150ms ease-out',
      background: isActive ? 'rgba(56,189,248,0.12)' : 'transparent',
      border: isActive ? '0.5px solid rgba(56,189,248,0.4)' : '0.5px solid var(--border-panel)',
      color: isActive ? 'var(--text-accent)' : 'var(--text-muted)',
    });

    const getIconStroke = (isActive: boolean) => (isActive ? 'var(--text-accent)' : 'var(--text-muted)');

    return (
      <div style={barStyle}>
        <span style={labelStyle}>Panels:</span>

        {/* KPI Strip Toggle */}
        <button style={getBtnStyle(visibility.kpiStrip)} onClick={() => onToggle('kpiStrip')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="4.5" cy="4.5" r="1.5" stroke={getIconStroke(visibility.kpiStrip)} strokeWidth="1.2"/>
            <circle cx="9.5" cy="4.5" r="1.5" stroke={getIconStroke(visibility.kpiStrip)} strokeWidth="1.2"/>
            <circle cx="4.5" cy="9.5" r="1.5" stroke={getIconStroke(visibility.kpiStrip)} strokeWidth="1.2"/>
            <circle cx="9.5" cy="9.5" r="1.5" stroke={getIconStroke(visibility.kpiStrip)} strokeWidth="1.2"/>
          </svg>
          KPI Strip
        </button>

        {/* Data Grid Toggle */}
        <button style={getBtnStyle(visibility.dataGrid)} onClick={() => onToggle('dataGrid')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 4H12" stroke={getIconStroke(visibility.dataGrid)} strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M2 7H10" stroke={getIconStroke(visibility.dataGrid)} strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M2 10H8" stroke={getIconStroke(visibility.dataGrid)} strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Data Grid
        </button>

        {/* Filters Toggle */}
        <button style={getBtnStyle(visibility.filterPanel)} onClick={() => onToggle('filterPanel')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 3L6 8V12L8 10V8L12 3H2Z" stroke={getIconStroke(visibility.filterPanel)} strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
          Filters
        </button>

        {/* Analytics Toggle */}
        <button style={getBtnStyle(visibility.analyticsChart)} onClick={() => onToggle('analyticsChart')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 11V7" stroke={getIconStroke(visibility.analyticsChart)} strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M7 11V3" stroke={getIconStroke(visibility.analyticsChart)} strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M11 11V5" stroke={getIconStroke(visibility.analyticsChart)} strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Analytics
        </button>

        {/* RIGHT SIDE */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            ref={rowCountRef}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text-secondary)',
            }}
          >
            Showing 0 / 0 rows
          </span>

          <div style={{ width: 1, height: 16, background: 'var(--border-panel)' }} />

          <button
            onClick={onReset}
            style={{
              background: 'transparent',
              border: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text-danger)',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Reset Layout
          </button>
        </div>
      </div>
    );
  }
);

export default PanelToggleBar;
