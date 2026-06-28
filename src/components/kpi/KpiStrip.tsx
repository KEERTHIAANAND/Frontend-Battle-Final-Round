'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { KpiSnapshot } from '@/lib/stateEngine';
import { formatCurrency } from '@/lib/formatters';

export interface KpiStripHandle {
  updateKpi: (kpi: KpiSnapshot) => void;
}

const KpiStrip = forwardRef<KpiStripHandle, {}>(function KpiStrip(props, ref) {
  const rowsRef = useRef<HTMLSpanElement>(null);
  const robotsRef = useRef<HTMLSpanElement>(null);
  const savingsRef = useRef<HTMLSpanElement>(null);

  useImperativeHandle(ref, () => ({
    updateKpi(kpi: KpiSnapshot) {
      if (rowsRef.current) {
        rowsRef.current.textContent = kpi.totalRowsProcessed.toLocaleString();
      }
      if (robotsRef.current) {
        robotsRef.current.textContent = kpi.totalRobotsSeen.toLocaleString();
      }
      if (savingsRef.current) {
        savingsRef.current.textContent = formatCurrency(kpi.totalSavingsSeen);
      }
      
      // Tick animation
      [rowsRef, robotsRef, savingsRef].forEach(nodeRef => {
        if (!nodeRef.current) return;
        nodeRef.current.classList.add('kpi-tick');
        nodeRef.current.addEventListener('animationend', () => {
          nodeRef.current?.classList.remove('kpi-tick');
        }, { once: true });
      });
    }
  }));

  const stripStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 0,
    height: 72,
    background: 'var(--bg-panel)',
    borderBottom: '0.5px solid var(--border-panel)'
  };

  const cardStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRight: '0.5px solid var(--border-panel)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '4px'
  };

  const labelRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: 'var(--font-sans)',
    fontSize: '9px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--text-muted)'
  };

  const valueRowStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '22px',
    fontWeight: 500,
    display: 'inline-block'
  };

  return (
    <div style={stripStyle}>
      {/* CARD 1 — ROWS PROCESSED */}
      <div style={cardStyle}>
        <div style={labelRowStyle}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 3H10M2 6H10M2 9H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Rows Processed
        </div>
        <div style={{...valueRowStyle, color: 'var(--text-primary)'}}>
          <span ref={rowsRef} style={{ display: 'inline-block' }}>0</span>
        </div>
      </div>

      {/* CARD 2 — ROBOTS DEPLOYED */}
      <div style={cardStyle}>
        <div style={labelRowStyle}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M5.05 2h1.9l.3 1.35c.4.15.75.35 1.1.6l1.1-.75 1.35 1.35-.75 1.1c.25.35.45.7.6 1.1l1.35.3v1.9l-1.35.3c-.15.4-.35.75-.6 1.1l.75 1.1-1.35 1.35-1.1-.75c-.35.25-.7.45-1.1.6l-.3 1.35h-1.9l-.3-1.35c-.4-.15-.75-.35-1.1-.6l-1.1.75-1.35-1.35.75-1.1c-.25-.35-.45-.7-.6-1.1L2 6.95v-1.9l1.35-.3c.15-.4.35-.75.6-1.1L3.2 2.55l1.35-1.35 1.1.75c.35-.25.7-.45 1.1-.6L5.05 2zM6 8a2 2 0 100-4 2 2 0 000 4z" fill="currentColor"/>
          </svg>
          Robots Deployed
        </div>
        <div style={{...valueRowStyle, color: 'var(--text-accent)'}}>
          <span ref={robotsRef} style={{ display: 'inline-block' }}>0</span>
        </div>
      </div>

      {/* CARD 3 — GLOBAL SAVINGS */}
      <div style={cardStyle}>
        <div style={labelRowStyle}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 10L10 2M10 2H5.5M10 2V6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Global Savings
        </div>
        <div style={{...valueRowStyle, color: 'var(--text-success)'}}>
          <span ref={savingsRef} style={{ display: 'inline-block' }}>$0</span>
        </div>
      </div>

      {/* CARD 4 — STREAM HEALTH */}
      <div style={{...cardStyle, background: 'rgba(56,189,248,0.04)', borderRight: 'none'}}>
        <div style={labelRowStyle}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2v4l2.5 1.5M11 6A5 5 0 111 6a5 5 0 0110 0z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Stream Health
        </div>
        <div style={{...valueRowStyle, color: 'var(--text-accent)'}}>
          <span style={{ fontSize: '14px' }}>200ms / tick</span>
        </div>
      </div>
    </div>
  );
});

export default KpiStrip;
