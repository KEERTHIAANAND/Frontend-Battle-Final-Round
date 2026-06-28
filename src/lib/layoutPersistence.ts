export type PanelKey = 'kpiStrip' | 'filterPanel' | 'dataGrid' | 'analyticsChart';
export type PanelVisibility = Record<PanelKey, boolean>;

const KEY = 'atlasrpa_v1_panels';

export const DEFAULT_VISIBILITY: PanelVisibility = {
  kpiStrip: true,
  filterPanel: true,
  dataGrid: true,
  analyticsChart: false    // analytics hidden by default (performance)
};

export function loadPanelVisibility(): PanelVisibility {
  try {
    if (typeof window === 'undefined') return DEFAULT_VISIBILITY;
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_VISIBILITY;
    return { ...DEFAULT_VISIBILITY, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_VISIBILITY;
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
  savePanelVisibility(DEFAULT_VISIBILITY);
  return DEFAULT_VISIBILITY;
}
