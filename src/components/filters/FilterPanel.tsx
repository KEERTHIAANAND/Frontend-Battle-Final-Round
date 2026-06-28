'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

export interface FilterState {
  automation_type?: string[];
  department?: string[];
  industry?: string[];
}

export interface FilterPanelHandle {
  getFilterState: () => FilterState;
  populateOptions: (data: { 
    automation_type: string[], department: string[], industry: string[] 
  }) => void;
  focusSearch: () => void;
  clearAll: () => void;
}

interface FilterPanelProps {
  onSearch?: (tokens: string[]) => void;
  onFilterChange?: (filters: FilterState) => void;
}

const FilterPanel = forwardRef<FilterPanelHandle, FilterPanelProps>(
  function FilterPanel({ onSearch, onFilterChange }, ref) {
    const [searchVal, setSearchVal] = useState('');
    const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Available options from stream
    const [options, setOptions] = useState({
      automation_type: [] as string[],
      department: [] as string[],
      industry: [] as string[]
    });

    // Selected sets
    const [selected, setSelected] = useState({
      automation_type: new Set<string>(),
      department: new Set<string>(),
      industry: new Set<string>()
    });

    // Quick filters
    const [quickFilters, setQuickFilters] = useState({
      aiEnabled: false,
      cloudDeployed: false
    });

    // Open dropdown state
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const getFilterState = (): FilterState => {
      return {
        automation_type: Array.from(selected.automation_type),
        department: Array.from(selected.department),
        industry: Array.from(selected.industry)
      };
    };

    useImperativeHandle(ref, () => ({
      getFilterState,
      populateOptions: (data) => {
        setOptions(data);
      },
      focusSearch: () => {
        searchInputRef.current?.focus();
      },
      clearAll: () => {
        handleClearSearch();
        handleClearAll();
      }
    }));

    useEffect(() => {
      return () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
      };
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchVal(e.target.value);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        const tokens = e.target.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
        onSearch?.(tokens);
      }, 150);
    };

    const handleClearSearch = () => {
      setSearchVal('');
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      onSearch?.([]);
    };

    const handleCheckboxChange = (category: keyof typeof selected, value: string) => {
      setSelected(prev => {
        const nextSet = new Set(prev[category]);
        if (nextSet.has(value)) {
          nextSet.delete(value);
        } else {
          nextSet.add(value);
        }
        const nextState = { ...prev, [category]: nextSet };
        
        // Fire callback immediately with new state
        if (onFilterChange) {
          onFilterChange({
            automation_type: Array.from(nextState.automation_type),
            department: Array.from(nextState.department),
            industry: Array.from(nextState.industry)
          });
        }
        return nextState;
      });
    };

    const handleClearAll = () => {
      const nextState = {
        automation_type: new Set<string>(),
        department: new Set<string>(),
        industry: new Set<string>()
      };
      setSelected(nextState);
      onFilterChange?.({
        automation_type: [],
        department: [],
        industry: []
      });
    };

    const totalActive = selected.automation_type.size + selected.department.size + selected.industry.size;

    const renderDropdown = (category: keyof typeof selected, label: string) => {
      const isOpen = openDropdown === category;
      const count = selected[category].size;

      return (
        <div style={{ borderBottom: '0.5px solid var(--border-panel)' }}>
          <button
            onClick={() => setOpenDropdown(isOpen ? null : category)}
            style={{
              width: '100%',
              padding: '10px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', letterSpacing: '0.08em' }}>
                {label}
              </span>
              {count > 0 && <span style={{ color: 'var(--text-accent)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>({count})</span>}
            </div>
            <svg 
              width="12" height="12" viewBox="0 0 12 12" fill="none"
              style={{
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 200ms ease-out'
              }}
            >
              <path d="M3 4.5L6 7.5L9 4.5" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          <div style={{
            maxHeight: isOpen ? '200px' : '0',
            overflowY: isOpen ? 'auto' : 'hidden',
            transition: 'max-height 250ms cubic-bezier(0.4,0,0.2,1)',
            background: 'var(--bg-terminal)',
          }}>
            {options[category].map(opt => (
              <label 
                key={opt}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 12px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <input 
                  type="checkbox"
                  className="custom-checkbox"
                  checked={selected[category].has(opt)}
                  onChange={() => handleCheckboxChange(category, opt)}
                />
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)' }}>
                  {opt}
                </span>
              </label>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="filter-panel-root" style={{
        width: '260px',
        height: '100%',
        overflowY: 'auto',
        background: 'var(--bg-panel)',
      }}>
        <style dangerouslySetInnerHTML={{__html: `
          .filter-panel-root::-webkit-scrollbar { width: 6px; height: 6px; }
          .filter-panel-root::-webkit-scrollbar-track { background: var(--bg-terminal); }
          .filter-panel-root::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
          .filter-panel-root::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
          
          .search-wrapper:focus-within { border-color: rgba(56,189,248,0.5) !important; }
          
          .custom-checkbox {
            appearance: none;
            -webkit-appearance: none;
            width: 14px;
            height: 14px;
            border: 0.5px solid var(--border-panel);
            border-radius: 3px;
            background: transparent;
            margin: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 150ms ease;
            flex-shrink: 0;
          }
          .custom-checkbox:checked {
            background: var(--text-accent);
            border-color: var(--text-accent);
          }
          .custom-checkbox:checked::after {
            content: '✓';
            color: #000;
            font-size: 10px;
            font-weight: bold;
          }
        `}} />

        {/* SECTION: Search Bar */}
        <div style={{ padding: '12px', borderBottom: '0.5px solid var(--border-panel)' }}>
          <label style={{
            display: 'block',
            fontSize: '9px',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '6px',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '0.08em'
          }}>
            Search
          </label>
          <div className="search-wrapper" style={{
            position: 'relative',
            background: 'var(--bg-terminal)',
            borderRadius: '6px',
            border: '0.5px solid var(--border-panel)',
            transition: 'border-color 150ms ease-out'
          }}>
            <svg style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
                 width="14" height="14" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="12" y1="12" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            
            <input
              ref={searchInputRef}
              type="text"
              value={searchVal}
              onChange={handleSearchChange}
              placeholder="project, company, partner..."
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                width: '100%',
                padding: '8px 8px 8px 28px'
              }}
            />

            {searchVal && (
              <button
                onClick={handleClearSearch}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'var(--text-primary)',
                  fontSize: '10px',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* SECTION: Active Filter Count Badge */}
        {totalActive > 0 && (
          <div style={{
            padding: '8px 12px',
            background: 'rgba(56,189,248,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '0.5px solid var(--border-panel)'
          }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-accent)' }}>
              {totalActive} filters active
            </span>
            <button
              onClick={handleClearAll}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '10px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                textDecoration: 'underline'
              }}
            >
              Clear all
            </button>
          </div>
        )}

        {/* SECTION: Categorical Filters */}
        {renderDropdown('automation_type', 'Automation Type')}
        {renderDropdown('department', 'Department')}
        {renderDropdown('industry', 'Industry')}

        {/* BOTTOM: Quick filter chips */}
        <div style={{ padding: '16px 12px' }}>
          <span style={{
            display: 'block',
            fontSize: '9px',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '10px',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '0.08em'
          }}>
            Quick Filters
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setQuickFilters(p => ({ ...p, aiEnabled: !p.aiEnabled }))}
              style={{
                padding: '4px 10px',
                borderRadius: '99px',
                fontSize: '10px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 150ms ease',
                background: quickFilters.aiEnabled ? 'rgba(74,222,128,0.12)' : 'transparent',
                border: quickFilters.aiEnabled ? '1px solid rgba(74,222,128,0.3)' : '1px solid var(--border-panel)',
                color: quickFilters.aiEnabled ? 'var(--text-success)' : 'var(--text-muted)'
              }}
            >
              AI Enabled
            </button>
            <button
              onClick={() => setQuickFilters(p => ({ ...p, cloudDeployed: !p.cloudDeployed }))}
              style={{
                padding: '4px 10px',
                borderRadius: '99px',
                fontSize: '10px',
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 150ms ease',
                background: quickFilters.cloudDeployed ? 'rgba(74,222,128,0.12)' : 'transparent',
                border: quickFilters.cloudDeployed ? '1px solid rgba(74,222,128,0.3)' : '1px solid var(--border-panel)',
                color: quickFilters.cloudDeployed ? 'var(--text-success)' : 'var(--text-muted)'
              }}
            >
              Cloud Deployed
            </button>
          </div>
        </div>

      </div>
    );
  }
);

export default FilterPanel;
