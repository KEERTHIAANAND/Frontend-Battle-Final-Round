/**
 * stateEngine.ts — Central state manager for the AtlasRPA Control Terminal.
 *
 * Design contract:
 *   • Plain TypeScript class — NO React, NO hooks, NO re-renders.
 *   • Every method is synchronous — no async, no promises.
 *   • KPI accumulators are ADDITIVE (total of everything ever received,
 *     not current pool sum). They only go up.
 *   • Exported as a singleton instance.
 */

import type { RpaRow } from '@/types/rpa';

// ─── Supporting Types ──────────────────────────────────────────────────────────

export interface ViewConfig {
  filters: {
    automation_type?: string[];
    department?: string[];
    industry?: string[];
  };
  sorts: SortEntry[];
  searchTokens: string[];
}

export interface SortEntry {
  column: keyof RpaRow;
  direction: 'asc' | 'desc';
}

export interface KpiSnapshot {
  totalRowsProcessed: number;
  totalRobotsSeen: number;
  totalSavingsSeen: number;
}

// ─── Number Coercion ──────────────────────────────────────────────────────────
// The CSV parser in dataStream.js only casts specific column names to numbers.
// Our CSV columns (robots_deployed, budget_usd, etc.) are NOT in that list,
// so they arrive as strings. We coerce them here on ingestion.

function coerceRow(raw: Record<string, unknown>): RpaRow {
  const row = raw as RpaRow;
  row.robots_deployed = Number(row.robots_deployed) || 0;
  row.budget_usd = Number(row.budget_usd) || 0;
  row.annual_savings_usd = Number(row.annual_savings_usd) || 0;
  row.roi_percent = Number(row.roi_percent) || 0;
  row.employee_hours_saved = Number(row.employee_hours_saved) || 0;
  return row;
}

// ─── State Engine Class ────────────────────────────────────────────────────────

class StateEngine {
  /** The master data pool keyed by project_id. */
  masterPool: Map<string, RpaRow> = new Map();

  /**
   * KPI accumulators — ADDITIVE.
   * These track the total of everything ever received, not the current pool sum.
   * They only ever go up.
   */
  kpi: KpiSnapshot = {
    totalRowsProcessed: 0,
    totalRobotsSeen: 0,
    totalSavingsSeen: 0,
  };

  /**
   * Merge an incoming batch of rows into the masterPool.
   *
   * KPI accumulators are purely additive:
   *   - totalRowsProcessed += batch.length (every tick)
   *   - totalRobotsSeen += sum of all robots_deployed values in batch
   *   - totalSavingsSeen += sum of all annual_savings_usd values in batch
   *
   * masterPool upserts by project_id (last write wins).
   */
  processBatch(batch: RpaRow[]): void {
    this.kpi.totalRowsProcessed += batch.length;

    for (let i = 0; i < batch.length; i++) {
      const row = coerceRow(batch[i] as unknown as Record<string, unknown>);
      this.kpi.totalRobotsSeen += row.robots_deployed;
      this.kpi.totalSavingsSeen += row.annual_savings_usd;
      this.masterPool.set(row.project_id, row);
    }
  }

  /**
   * Produce a filtered, sorted, and search-matched snapshot of masterPool.
   *
   * Pipeline:
   *   1. All rows from masterPool → array
   *   2. Search filter (AND logic across project_name, company_id,
   *      implementation_partner, country)
   *   3. Categorical filters (OR within field, AND between fields)
   *   4. Multi-column sort (priority order)
   */
  getViewPool(config: ViewConfig): RpaRow[] {
    // Step 1: all rows from masterPool
    let pool = Array.from(this.masterPool.values());

    // Step 2: search filter (AND logic across 4 fields)
    if (config.searchTokens && config.searchTokens.length > 0) {
      pool = pool.filter((row) => {
        const text = [
          row.project_name,
          row.company_id,
          row.implementation_partner,
          row.country,
          row.project_id,
          row.industry,
          row.department,
          row.automation_type,
        ]
          .join(' ')
          .toLowerCase();
        return config.searchTokens.every((t) => text.includes(t));
      });
    }

    // Step 3: categorical filters (OR within field, AND between fields)
    if (config.filters) {
      if (config.filters.automation_type && config.filters.automation_type.length > 0) {
        pool = pool.filter((r) =>
          config.filters.automation_type!.includes(r.automation_type),
        );
      }
      if (config.filters.department && config.filters.department.length > 0) {
        pool = pool.filter((r) =>
          config.filters.department!.includes(r.department),
        );
      }
      if (config.filters.industry && config.filters.industry.length > 0) {
        pool = pool.filter((r) =>
          config.filters.industry!.includes(r.industry),
        );
      }
    }

    // Step 4: multi-column sort (priority order)
    if (config.sorts && config.sorts.length > 0) {
      pool = [...pool].sort((a, b) => {
        for (const s of config.sorts) {
          const av = a[s.column];
          const bv = b[s.column];
          let cmp: number;

          if (typeof av === 'number' && typeof bv === 'number') {
            cmp = av - bv;
          } else {
            cmp = String(av ?? '').localeCompare(String(bv ?? ''));
          }

          if (cmp !== 0) return s.direction === 'asc' ? cmp : -cmp;
        }
        return 0;
      });
    }

    return pool;
  }

  /**
   * Get all unique values for a given column (for filter dropdowns).
   * Returns a sorted array of distinct non-empty string values.
   */
  getUniqueValues(col: keyof RpaRow): string[] {
    return Array.from(
      new Set(
        Array.from(this.masterPool.values())
          .map((r) => String(r[col] ?? ''))
          .filter(Boolean),
      ),
    ).sort();
  }

  /**
   * Get a shallow copy of the current KPI snapshot.
   */
  getKpiSnapshot(): KpiSnapshot {
    return { ...this.kpi };
  }

  /**
   * Get the current size of the master pool.
   */
  getPoolSize(): number {
    return this.masterPool.size;
  }

  /**
   * Get a single row by project_id (for detail panels / tooltips).
   */
  getRow(projectId: string): RpaRow | undefined {
    return this.masterPool.get(projectId);
  }

  /**
   * Full reset — used when reconnecting or switching data sources.
   */
  reset(): void {
    this.masterPool.clear();
    this.kpi.totalRowsProcessed = 0;
    this.kpi.totalRobotsSeen = 0;
    this.kpi.totalSavingsSeen = 0;
  }
}

// ─── Singleton Export ──────────────────────────────────────────────────────────

export const stateEngine = new StateEngine();
