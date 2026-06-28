import type { RpaRow } from '@/types/rpa';

/**
 * inspectorController.ts — Vanilla JS event bus for the Row Inspector Panel.
 *
 * This is the bridge between VirtualGrid's DOM click handler and the
 * InspectorPanel React component rendered in an isolated portal.
 * No React, no useState — just a plain publish/subscribe pattern.
 */

type InspectorListener = (row: RpaRow | null) => void;

class InspectorController {
  private listeners: Set<InspectorListener> = new Set();
  private currentRow: RpaRow | null = null;
  private isOpen = false;

  /** Called by VirtualGrid click handler when stream is paused */
  openInspector(row: RpaRow): void {
    this.currentRow = row;
    this.isOpen = true;
    this.listeners.forEach(fn => fn(row));
  }

  /** Called by close button or Escape key */
  closeInspector(): void {
    this.currentRow = null;
    this.isOpen = false;
    this.listeners.forEach(fn => fn(null));
  }

  /** InspectorPanel subscribes to this. Returns an unsubscribe function. */
  subscribe(fn: InspectorListener): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  get open(): boolean { return this.isOpen; }
  get row(): RpaRow | null { return this.currentRow; }
}

export const inspectorController = new InspectorController();
