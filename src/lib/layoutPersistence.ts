export type PanelKey = 'kpiStrip' | 'filterPanel' | 'dataGrid' | 'analyticsChart';
export type PanelVisibility = Record<PanelKey, boolean>;

const KEY = 'neuropulse_v1_panels';

const DEFAULTS: PanelVisibility = {
  kpiStrip: true,
  filterPanel: true,
  dataGrid: true,
  analyticsChart: false    // analytics hidden by default (performance)
};

export function loadPanelVisibility(): PanelVisibility {
  try {
    if (typeof window === 'undefined') return DEFAULTS;
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function savePanelVisibility(v: PanelVisibility): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    return;
  }
}

export function togglePanel(current: PanelVisibility, key: PanelKey): PanelVisibility {
  const next = { ...current, [key]: !current[key] };
  savePanelVisibility(next);
  return next;
}

export function resetPanels(): PanelVisibility {
  savePanelVisibility(DEFAULTS);
  return DEFAULTS;
}
