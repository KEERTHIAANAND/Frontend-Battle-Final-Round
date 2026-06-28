/**
 * streamController.ts — Bridge between dataStream.js and the AtlasRPA app.
 *
 * This module:
 *   1. Hooks into window.initializeRpaStream (from the hackathon-provided engine)
 *   2. Feeds every incoming batch into stateEngine.processBatch
 *   3. Uses requestAnimationFrame batching so multiple 200ms ticks within
 *      one frame only produce a single render callback
 *   4. Supports pause/play with a pending queue
 *
 * Exported as a singleton instance — no React, no hooks.
 */

import type { RpaRow } from '@/types/rpa';
import {
  stateEngine,
  type ViewConfig,
  type KpiSnapshot,
} from '@/lib/stateEngine';

// ─── Extend Window for the hackathon global ────────────────────────────────────

declare global {
  interface Window {
    initializeRpaStream?: (
      callback: (batch: RpaRow[]) => void,
      csvPath: string,
    ) => void;
  }
}

// ─── Stream Controller Class ───────────────────────────────────────────────────

class StreamController {
  private isPaused = false;
  private pendingQueue: RpaRow[][] = [];
  private renderCallback: ((pool: RpaRow[]) => void) | null = null;
  private kpiCallback: ((kpi: KpiSnapshot) => void) | null = null;
  private viewConfig: ViewConfig = {
    filters: {},
    sorts: [],
    searchTokens: [],
  };
  private rafPending = false;
  private latestPool: RpaRow[] = [];

  /** Timestamp of the last UI update — useful for "last updated" display. */
  lastUpdateTime = Date.now();

  /**
   * Wire up the data stream.
   *
   * @param renderCb — called on each animation frame with the filtered/sorted pool
   * @param kpiCb    — called on each animation frame with the latest KPI snapshot
   */
  initialize(
    renderCb: (pool: RpaRow[]) => void,
    kpiCb: (kpi: KpiSnapshot) => void,
  ): void {
    this.renderCallback = renderCb;
    this.kpiCallback = kpiCb;

    // This is the EXACT pattern from the provided index.html demo:
    if (typeof window !== 'undefined' && window.initializeRpaStream) {
      window.initializeRpaStream((incomingBatch: RpaRow[]) => {
        // ALWAYS process into state engine — even when paused.
        // The masterPool and KPI accumulators stay current regardless.
        stateEngine.processBatch(incomingBatch);

        if (this.isPaused) {
          // Buffer the batch reference for queue-length display,
          // but do NOT trigger a UI render.
          this.pendingQueue.push(incomingBatch);
          return;
        }

        this.scheduleRender();
      }, '/rpa_database_2026.csv');
    }
  }

  /**
   * RAF batching: if multiple ticks arrive within one animation frame,
   * only the last viewPool snapshot is rendered.
   */
  private scheduleRender(): void {
    this.latestPool = stateEngine.getViewPool(this.viewConfig);
    this.lastUpdateTime = Date.now();

    if (!this.rafPending) {
      this.rafPending = true;
      requestAnimationFrame(() => {
        this.rafPending = false;
        this.renderCallback?.(this.latestPool);
        this.kpiCallback?.(stateEngine.getKpiSnapshot());
      });
    }
  }

  /**
   * Pause the UI stream.
   * State engine continues accumulating, but no render callbacks fire.
   */
  pause(): void {
    this.isPaused = true;
    this.pendingQueue = [];
  }

  /**
   * Resume the UI stream.
   * Flushes the latest accumulated state in one render.
   */
  play(): void {
    this.isPaused = false;
    this.pendingQueue = [];
    this.scheduleRender();
  }

  /**
   * Update view configuration (filters, sorts, search).
   * Triggers an immediate re-render if not paused.
   */
  updateViewConfig(partial: Partial<ViewConfig>): void {
    this.viewConfig = { ...this.viewConfig, ...partial };
    if (!this.isPaused) {
      this.scheduleRender();
    }
  }

  /**
   * Get the current view config (read-only snapshot).
   */
  getViewConfig(): ViewConfig {
    return { ...this.viewConfig };
  }

  /** Number of batches buffered during pause. */
  get queueLength(): number {
    return this.pendingQueue.length;
  }

  /** Whether the stream UI is currently paused. */
  get paused(): boolean {
    return this.isPaused;
  }

  /** Current pool size in the state engine. */
  get poolSize(): number {
    return stateEngine.getPoolSize();
  }
}

// ─── Singleton Export ──────────────────────────────────────────────────────────

export const streamController = new StreamController();
