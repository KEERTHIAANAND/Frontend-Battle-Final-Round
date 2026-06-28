'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Chart, registerables } from 'chart.js';
import type { RpaRow } from '@/types/rpa';

Chart.register(...registerables);

function computeDeptROI(pool: RpaRow[]) {
  const deptMap = new Map<string, { sum: number, count: number }>();
  for (let i = 0; i < pool.length; i++) {
    const row = pool[i];
    const dept = row.department;
    if (!dept) continue;
    const current = deptMap.get(dept) || { sum: 0, count: 0 };
    current.sum += row.roi_percent || 0;
    current.count += 1;
    deptMap.set(dept, current);
  }
  const avgList = Array.from(deptMap.entries()).map(([dept, data]) => ({
    dept,
    avg: data.sum / data.count
  }));
  avgList.sort((a, b) => b.avg - a.avg);
  const top8 = avgList.slice(0, 8);
  return {
    labels: top8.map(d => d.dept),
    values: top8.map(d => d.avg)
  };
}

function computeTypeDistribution(pool: RpaRow[]) {
  const typeMap = new Map<string, number>();
  for (let i = 0; i < pool.length; i++) {
    const row = pool[i];
    const type = row.automation_type;
    if (!type) continue;
    typeMap.set(type, (typeMap.get(type) || 0) + 1);
  }
  const sorted = Array.from(typeMap.entries()).sort((a, b) => b[1] - a[1]);
  return {
    labels: sorted.map(d => d[0]),
    values: sorted.map(d => d[1])
  };
}

function computeTopIndustry(pool: RpaRow[]) {
  const industryMap = new Map<string, { sum: number, count: number }>();
  for (let i = 0; i < pool.length; i++) {
    const row = pool[i];
    const ind = row.industry;
    if (!ind) continue;
    const current = industryMap.get(ind) || { sum: 0, count: 0 };
    current.sum += row.roi_percent || 0;
    current.count += 1;
    industryMap.set(ind, current);
  }
  let topInd = 'N/A';
  let maxAvg = -Infinity;
  for (const [ind, data] of industryMap.entries()) {
    const avg = data.sum / data.count;
    if (avg > maxAvg) {
      maxAvg = avg;
      topInd = ind;
    }
  }
  return topInd.length > 12 ? topInd.slice(0, 12) + '...' : topInd;
}

function computeTopType(pool: RpaRow[]) {
  const typeMap = new Map<string, number>();
  let maxCount = 0;
  let topType = 'N/A';
  for (let i = 0; i < pool.length; i++) {
    const row = pool[i];
    const type = row.automation_type;
    if (!type) continue;
    const count = (typeMap.get(type) || 0) + 1;
    typeMap.set(type, count);
    if (count > maxCount) {
      maxCount = count;
      topType = type;
    }
  }
  return topType;
}

function computeCountryCount(pool: RpaRow[]) {
  const countries = new Set<string>();
  for (let i = 0; i < pool.length; i++) {
    if (pool[i].country) countries.add(pool[i].country);
  }
  return countries.size.toString();
}

function computeAIPct(pool: RpaRow[]) {
  if (pool.length === 0) return '0.0%';
  let aiCount = 0;
  for (let i = 0; i < pool.length; i++) {
    if (pool[i].ai_enabled === 'Yes') aiCount++;
  }
  return ((aiCount / pool.length) * 100).toFixed(1) + '%';
}

export interface AnalyticsChartHandle {
  update: (pool: RpaRow[]) => void;
}

const AnalyticsChart = forwardRef<AnalyticsChartHandle, {}>(
  function AnalyticsChart(props, ref) {
    const barChartRef = useRef<Chart | null>(null);
    const doughnutChartRef = useRef<Chart | null>(null);
    
    const barCanvasRef = useRef<HTMLCanvasElement>(null);
    const doughnutCanvasRef = useRef<HTMLCanvasElement>(null);
    
    const tickCountRef = useRef(0);
    
    // DOM patching refs
    const topIndustryRef = useRef<HTMLSpanElement>(null);
    const topTypeRef = useRef<HTMLSpanElement>(null);
    const countriesRef = useRef<HTMLSpanElement>(null);
    const aiPctRef = useRef<HTMLSpanElement>(null);

    useImperativeHandle(ref, () => ({
      update: (pool: RpaRow[]) => {
        tickCountRef.current++;
        // Update chart only every 10 stream ticks
        if (tickCountRef.current % 10 !== 0) return;
        
        // Recompute all chart data
        const deptStats = computeDeptROI(pool);
        const typeStats = computeTypeDistribution(pool);
        
        // Update Chart.js instances (not recreate — just update data and call .update())
        if (barChartRef.current) {
          barChartRef.current.data.labels = deptStats.labels;
          barChartRef.current.data.datasets[0].data = deptStats.values;
          barChartRef.current.update('none');
        }
        
        if (doughnutChartRef.current) {
          doughnutChartRef.current.data.labels = typeStats.labels;
          doughnutChartRef.current.data.datasets[0].data = typeStats.values;
          doughnutChartRef.current.update('none');
        }
        
        // Update mini stats via DOM refs
        if (topIndustryRef.current) topIndustryRef.current.textContent = computeTopIndustry(pool);
        if (topTypeRef.current) topTypeRef.current.textContent = computeTopType(pool);
        if (countriesRef.current) countriesRef.current.textContent = computeCountryCount(pool);
        if (aiPctRef.current) aiPctRef.current.textContent = computeAIPct(pool);
      }
    }));

    useEffect(() => {
      // Initialize charts
      if (barCanvasRef.current && !barChartRef.current) {
        barChartRef.current = new Chart(barCanvasRef.current, {
          type: 'bar',
          data: {
            labels: [],
            datasets: [{
              label: 'Avg ROI %',
              data: [],
              backgroundColor: 'rgba(56,189,248,0.6)',
              hoverBackgroundColor: 'rgba(56,189,248,0.9)',
              borderRadius: 2
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              x: { 
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } }
              },
              y: {
                grid: { display: false },
                ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } }
              }
            }
          }
        });
      }

      if (doughnutCanvasRef.current && !doughnutChartRef.current) {
        doughnutChartRef.current = new Chart(doughnutCanvasRef.current, {
          type: 'doughnut',
          data: {
            labels: [],
            datasets: [{
              data: [],
              backgroundColor: [
                'rgba(56,189,248,0.8)', 
                'rgba(255,200,1,0.8)', 
                'rgba(74,222,128,0.8)',
                'rgba(248,113,113,0.8)', 
                'rgba(167,139,250,0.8)', 
                'rgba(251,146,60,0.8)'
              ],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            cutout: '70%',
            plugins: {
              legend: { display: false }
            }
          }
        });
      }

      return () => {
        if (barChartRef.current) {
          barChartRef.current.destroy();
          barChartRef.current = null;
        }
        if (doughnutChartRef.current) {
          doughnutChartRef.current.destroy();
          doughnutChartRef.current = null;
        }
      };
    }, []);

    const col1Style: React.CSSProperties = {
      flex: 2,
      padding: '16px',
      borderRight: '0.5px solid var(--border-panel)',
      display: 'flex',
      flexDirection: 'column'
    };
    const col2Style: React.CSSProperties = {
      flex: 1,
      padding: '16px',
      borderRight: '0.5px solid var(--border-panel)',
      display: 'flex',
      flexDirection: 'column'
    };
    const col3Style: React.CSSProperties = {
      flex: 1,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr'
    };

    const titleStyle: React.CSSProperties = {
      fontFamily: 'var(--font-sans)',
      fontSize: '10px',
      textTransform: 'uppercase',
      color: 'var(--text-secondary)',
      marginBottom: '8px',
      letterSpacing: '0.08em'
    };

    const miniCardStyle: React.CSSProperties = {
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      borderBottom: '0.5px solid var(--border-panel)',
      borderRight: '0.5px solid var(--border-panel)'
    };

    const miniValueStyle: React.CSSProperties = {
      fontFamily: 'var(--font-mono)',
      fontSize: '18px',
      fontWeight: 600,
      marginTop: '4px'
    };

    return (
      <div style={{ display: 'flex', height: '220px', background: 'var(--bg-panel)' }}>
        
        {/* Column 1: Horizontal Bar Chart */}
        <div style={col1Style}>
          <div style={titleStyle}>Department ROI %</div>
          <div style={{ flex: 1, position: 'relative' }}>
            <canvas ref={barCanvasRef} />
          </div>
        </div>

        {/* Column 2: Doughnut Chart */}
        <div style={col2Style}>
          <div style={titleStyle}>Automation Types</div>
          <div style={{ flex: 1, position: 'relative' }}>
            <canvas ref={doughnutCanvasRef} />
          </div>
        </div>

        {/* Column 3: Mini Stat Cards */}
        <div style={col3Style}>
          <div style={miniCardStyle}>
            <div style={titleStyle}>Top Industry</div>
            <span ref={topIndustryRef} style={{ ...miniValueStyle, color: 'var(--text-warning)' }}>—</span>
          </div>
          <div style={miniCardStyle}>
            <div style={titleStyle}>Top Type</div>
            <span ref={topTypeRef} style={{ ...miniValueStyle, color: 'var(--text-accent)' }}>—</span>
          </div>
          <div style={miniCardStyle}>
            <div style={titleStyle}>Countries</div>
            <span ref={countriesRef} style={{ ...miniValueStyle, color: 'var(--text-success)' }}>—</span>
          </div>
          <div style={miniCardStyle}>
            <div style={titleStyle}>AI Enabled</div>
            <span ref={aiPctRef} style={{ ...miniValueStyle, color: 'rgba(167,139,250,1)' }}>—</span>
          </div>
        </div>
      </div>
    );
  }
);

export default AnalyticsChart;
