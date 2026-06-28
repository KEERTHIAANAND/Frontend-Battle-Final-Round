'use client';

import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  type Ref,
} from 'react';
import { streamController } from '@/lib/streamController';

/* ═══ Public handle exposed via ref ═══════════════════════════════════════════ */

export interface TopbarHandle {
  /** Patch all pause-related DOM nodes without triggering React re-render */
  setPauseVisuals(paused: boolean, queueLen: number): void;
}

interface TopbarProps {
  isPaused: boolean;
  onPausePlay: () => void;
  onExport: () => void;
}

/* ═══ Component ═══════════════════════════════════════════════════════════════ */

const Topbar = forwardRef(function Topbar(
  { isPaused, onPausePlay, onExport }: TopbarProps,
  ref: Ref<TopbarHandle>,
) {
  /* ── DOM refs for direct patching ── */
  const memoryRef = useRef<HTMLSpanElement>(null);
  const lastUpdateRef = useRef<HTMLSpanElement>(null);
  const queueCountRef = useRef<HTMLSpanElement>(null);
  const statusPillRef = useRef<HTMLDivElement>(null);
  const statusDotRef = useRef<HTMLSpanElement>(null);
  const statusTextRef = useRef<HTMLSpanElement>(null);
  const pauseBtnRef = useRef<HTMLButtonElement>(null);

  /* ── Imperative handle ── */
  useImperativeHandle(ref, () => ({
    setPauseVisuals(paused: boolean, queueLen: number) {
      // Status pill
      if (statusPillRef.current) {
        statusPillRef.current.style.borderColor = paused
          ? 'rgba(248,113,113,0.3)'
          : 'rgba(74,222,128,0.3)';
        statusPillRef.current.style.background = paused
          ? 'rgba(248,113,113,0.08)'
          : 'rgba(74,222,128,0.08)';
      }
      // Dot
      if (statusDotRef.current) {
        statusDotRef.current.style.background = paused
          ? 'var(--text-danger)'
          : 'var(--text-success)';
        statusDotRef.current.style.animation = paused
          ? 'none'
          : 'pulse-stream 2s infinite';
      }
      // Status text
      if (statusTextRef.current) {
        statusTextRef.current.textContent = paused ? 'BUFFERING' : 'STREAM LIVE';
        statusTextRef.current.style.color = paused
          ? 'var(--text-danger)'
          : 'var(--text-success)';
      }
      // Queue count
      if (queueCountRef.current) {
        queueCountRef.current.textContent = paused && queueLen > 0
          ? ` + ${queueLen} queued`
          : '';
        queueCountRef.current.style.color = 'var(--text-warning)';
      }
      // Pause button
      if (pauseBtnRef.current) {
        if (paused) {
          pauseBtnRef.current.textContent = '▶ Resume';
          pauseBtnRef.current.style.background = 'var(--text-success)';
          pauseBtnRef.current.style.color = '#000';
          pauseBtnRef.current.style.borderColor = 'var(--text-success)';
        } else {
          pauseBtnRef.current.textContent = '⏸ Pause';
          pauseBtnRef.current.style.background = 'transparent';
          pauseBtnRef.current.style.color = 'var(--text-warning)';
          pauseBtnRef.current.style.borderColor = 'var(--text-warning)';
        }
      }
    },
  }));

  /* ── Intervals for memory + last-update ── */
  useEffect(() => {
    const memInterval = setInterval(() => {
      if (!memoryRef.current) return;
      const perf = performance as unknown as { memory?: { usedJSHeapSize: number } };
      if (perf.memory) {
        memoryRef.current.textContent = `MEM: ${(perf.memory.usedJSHeapSize / 1_048_576).toFixed(1)} MB`;
      } else {
        memoryRef.current.textContent = 'MEM: N/A';
      }
    }, 2000);

    const updateInterval = setInterval(() => {
      if (!lastUpdateRef.current) return;
      const elapsed = Date.now() - streamController.lastUpdateTime;
      lastUpdateRef.current.textContent = `↻ ${elapsed}ms ago`;
    }, 200);

    return () => {
      clearInterval(memInterval);
      clearInterval(updateInterval);
    };
  }, []);

  /* ── Styles ── */
  const bar: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    padding: '0 16px',
    background: 'rgba(8,12,20,0.95)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '0.5px solid rgba(255,255,255,0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    flexShrink: 0,
  };

  const leftGroup: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  };

  const pill: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: 140,
    height: 28,
    borderRadius: 99,
    border: isPaused
      ? '1px solid rgba(248,113,113,0.3)'
      : '1px solid rgba(74,222,128,0.3)',
    background: isPaused
      ? 'rgba(248,113,113,0.08)'
      : 'rgba(74,222,128,0.08)',
    transition: 'all 150ms ease-out',
  };

  const dotStyle: React.CSSProperties = {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: isPaused ? 'var(--text-danger)' : 'var(--text-success)',
    animation: isPaused ? 'none' : 'pulse-stream 2s infinite',
    flexShrink: 0,
  };

  const rightGroup: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  };

  const mono10: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
  };

  const separator: React.CSSProperties = {
    width: 1,
    height: 20,
    background: 'rgba(255,255,255,0.1)',
    flexShrink: 0,
  };

  const btnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    padding: '0 14px',
    borderRadius: 99,
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.04em',
    cursor: 'pointer',
    transition: 'all 150ms ease-out',
    border: isPaused
      ? '1px solid var(--text-success)'
      : '1px solid var(--text-warning)',
    background: isPaused ? 'var(--text-success)' : 'transparent',
    color: isPaused ? '#000' : 'var(--text-warning)',
  };

  const helpBtn: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: '1px solid var(--border-panel)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 150ms ease-out',
  };

  return (
    <header style={bar}>
      {/* ── LEFT: Logo ── */}
      <div style={leftGroup}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M10 1L18.66 5.5V14.5L10 19L1.34 14.5V5.5L10 1Z"
            stroke="var(--text-accent)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 15,
            fontWeight: 500,
            color: 'var(--text-primary)',
          }}
        >
          AtlasRPA
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            paddingLeft: 8,
            borderLeft: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          RPA Control Terminal
        </span>
      </div>

      {/* ── CENTER: Stream status pill ── */}
      <div ref={statusPillRef} style={pill}>
        <span ref={statusDotRef} style={dotStyle} />
        <span
          ref={statusTextRef}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 600,
            color: isPaused ? 'var(--text-danger)' : 'var(--text-success)',
            letterSpacing: '0.06em',
          }}
        >
          {isPaused ? 'BUFFERING' : 'STREAM LIVE'}
        </span>
        <span ref={queueCountRef} style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }} />
      </div>

      {/* ── RIGHT: Metrics + controls ── */}
      <div style={rightGroup}>
        <span ref={memoryRef} style={mono10}>MEM: —</span>
        <span ref={lastUpdateRef} style={mono10}>↻ 0ms ago</span>
        <div style={separator} />
        <button style={btnBase} onClick={onExport} title="Export CSV (Ctrl+E)">
          📥 Export
        </button>
        <button ref={pauseBtnRef} style={btnBase} onClick={onPausePlay}>
          {isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button style={helpBtn} title="Help">?</button>
      </div>
    </header>
  );
});

export default Topbar;
