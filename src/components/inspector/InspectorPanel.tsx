'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { RpaRow } from '@/types/rpa';
import { inspectorController } from '@/lib/inspectorController';
import { formatCurrency, formatROI, formatNumber, formatDate } from '@/lib/formatters';
import './inspector.css';

/* ═══ Flag Lookup ═══ */
const FLAGS: Record<string,string> = {
  'United States':'🇺🇸','India':'🇮🇳','Japan':'🇯🇵','Germany':'🇩🇪',
  'United Kingdom':'🇬🇧','Australia':'🇦🇺','Canada':'🇨🇦','France':'🇫🇷',
  'Brazil':'🇧🇷','China':'🇨🇳','Singapore':'🇸🇬','South Korea':'🇰🇷',
  'Malaysia':'🇲🇾','Vietnam':'🇻🇳','Poland':'🇵🇱','Italy':'🇮🇹',
  'Spain':'🇪🇸','Colombia':'🇨🇴','South Africa':'🇿🇦','Kenya':'🇰🇪',
  'Qatar':'🇶🇦','Kuwait':'🇰🇼','Austria':'🇦🇹','Switzerland':'🇨🇭',
  'Denmark':'🇩🇰','New Zealand':'🇳🇿','Taiwan':'🇹🇼','Saudi Arabia':'🇸🇦',
  'Portugal':'🇵🇹','United Arab Emirates':'🇦🇪','Mexico':'🇲🇽','Netherlands':'🇳🇱',
  'Belgium':'🇧🇪','Thailand':'🇹🇭','Egypt':'🇪🇬','Ghana':'🇬🇭',
  'Nigeria':'🇳🇬','Philippines':'🇵🇭','Indonesia':'🇮🇩','Sweden':'🇸🇪',
  'Norway':'🇳🇴','Finland':'🇫🇮','Ireland':'🇮🇪','Chile':'🇨🇱',
  'Argentina':'🇦🇷','Peru':'🇵🇪','Czech Republic':'🇨🇿','Romania':'🇷🇴',
  'Hungary':'🇭🇺','Greece':'🇬🇷','Turkey':'🇹🇷','Israel':'🇮🇱',
  'Pakistan':'🇵🇰','Bangladesh':'🇧🇩','Sri Lanka':'🇱🇰','Myanmar':'🇲🇲',
};

const TYPE_COLORS: Record<string,[string,string]> = {
  'Customer Onboarding':['56,189,248','#38BDF8'],
  'Process Automation':['255,200,1','#FFC801'],
  'Data Extraction':['167,139,250','#A78BFA'],
  'HR Onboarding':['74,222,128','#4ADE80'],
  'Financial Reconciliation':['251,146,60','#FB923C'],
  'Quality Control':['96,165,250','#60A5FA'],
  'Document Processing':['244,114,182','#F472B6'],
  'Front Office Automation':['45,212,191','#2DD4BF'],
  'IT Helpdesk':['129,140,248','#818CF8'],
  'Report Generation':['253,186,116','#FDB974'],
  'Invoice Processing':['134,239,172','#86EFAC'],
  'Supply Chain Optimization':['252,211,77','#FCD34D'],
  'Fraud Detection':['248,113,113','#F87171'],
  'Inventory Management':['192,132,252','#C084FC'],
  'Email Automation':['56,189,248','#38BDF8'],
  'Compliance Monitoring':['255,200,1','#FFC801'],
  'Customer Support':['74,222,128','#4ADE80'],
};

function getStatusStyle(s:string){
  const m:Record<string,[string,string]>={
    Active:['74,222,128','#4ADE80'],Completed:['56,189,248','#38BDF8'],
    Planned:['255,200,1','#FFC801'],Failed:['248,113,113','#F87171'],
  };
  const c=m[s]||['148,163,184','#94A3B8'];
  return{bg:`rgba(${c[0]},0.12)`,border:`rgba(${c[0]},0.3)`,color:c[1]};
}

function getRoiColor(r:number):string{
  if(r<0)return'#F87171';if(r>100)return'#4ADE80';return'#FFC801';
}

/* ═══ Sub-Sections ═══ */

function InspectorHeader({row,onClose}:{row:RpaRow,onClose:()=>void}){
  const ss=getStatusStyle(row.project_status);
  return(
    <div style={{height:56,padding:'0 20px',borderBottom:'0.5px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(13,17,23,0.98)',position:'sticky',top:0,zIndex:10,flexShrink:0}}>
      <div>
        <div style={{fontSize:9,textTransform:'uppercase',fontFamily:'var(--font-mono)',letterSpacing:'0.1em',color:'rgba(56,189,248,0.7)'}}>Inspector</div>
        <div style={{fontSize:12,fontFamily:'var(--font-mono)',color:'#38BDF8'}}>{row.project_id}</div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'3px 10px',borderRadius:99,fontSize:10,fontFamily:'var(--font-mono)',fontWeight:600,color:ss.color,background:ss.bg,border:`1px solid ${ss.border}`}}>
          <span style={{width:6,height:6,borderRadius:'50%',background:ss.color}}/>
          {row.project_status}
        </span>
        <button onClick={onClose} style={{width:28,height:28,borderRadius:'50%',border:'none',background:'rgba(255,255,255,0.06)',color:'var(--text-secondary)',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'background 150ms ease-out'}}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.12)';}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';}}>×</button>
      </div>
    </div>
  );
}

function IdentitySection({row}:{row:RpaRow}){
  const flag=FLAGS[row.country]||'🌐';
  const tc=TYPE_COLORS[row.automation_type]||['148,163,184','#94A3B8'];
  return(
    <div className="inspector-section">
      <div style={{fontSize:18,fontFamily:'var(--font-mono)',fontWeight:500,color:'var(--text-primary)',marginBottom:14,wordBreak:'break-word'}}>{row.project_name}</div>
      <div className="inspector-stat-grid">
        <div className="inspector-stat-item"><div className="inspector-stat-label">Company</div><div className="inspector-stat-value">{row.company_id}</div></div>
        <div className="inspector-stat-item"><div className="inspector-stat-label">Partner</div><div className="inspector-stat-value" style={{color:'var(--text-secondary)',fontFamily:'var(--font-sans)'}}>{(row as any).partner_vendor||'—'}</div></div>
        <div className="inspector-stat-item"><div className="inspector-stat-label">Location</div><div className="inspector-stat-value">{flag} {row.country}</div></div>
        <div className="inspector-stat-item"><div className="inspector-stat-label">Industry</div><span style={{display:'inline-block',background:'rgba(255,255,255,0.06)',border:'0.5px solid rgba(255,255,255,0.12)',borderRadius:4,padding:'3px 8px',fontSize:11,fontFamily:'var(--font-sans)',color:'var(--text-secondary)',alignSelf:'flex-start'}}>{(row as any).industry||'—'}</span></div>
        <div className="inspector-stat-item"><div className="inspector-stat-label">Department</div><div className="inspector-stat-value" style={{color:'var(--text-secondary)',fontFamily:'var(--font-sans)'}}>{row.department}</div></div>
        <div className="inspector-stat-item"><div className="inspector-stat-label">Type</div><span className="type-pill" style={{background:`rgba(${tc[0]},0.12)`,border:`0.5px solid rgba(${tc[0]},0.3)`,color:tc[1],alignSelf:'flex-start'}}>{row.automation_type}</span></div>
      </div>
    </div>
  );
}

function TimelineSection({row}:{row:RpaRow}){
  const barRef=useRef<HTMLDivElement>(null);
  const start=new Date((row as any).start_date);
  const end=(row as any).completion_date?new Date((row as any).completion_date):new Date();
  const today=new Date();
  const totalDays=Math.max(1,(end.getTime()-start.getTime())/86400000);
  const elapsed=Math.min(totalDays,Math.max(0,(today.getTime()-start.getTime())/86400000));
  const progress=Math.min(100,(elapsed/totalDays)*100);
  const gradMap:Record<string,string>={Completed:'linear-gradient(90deg,#38BDF8,#4ADE80)',Failed:'#F87171'};
  const bg=gradMap[row.project_status]||'linear-gradient(90deg,#38BDF8,#FFC801)';

  useEffect(()=>{
    if(!barRef.current)return;
    barRef.current.style.width='0%';
    requestAnimationFrame(()=>{requestAnimationFrame(()=>{
      if(barRef.current) barRef.current.style.width=progress+'%';
    });});
  },[row, progress]);

  return(
    <div className="inspector-section">
      <div className="inspector-section-label">Timeline</div>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:10,color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>
        <span>{formatDate((row as any).start_date)}</span>
        <span>{(row as any).completion_date?formatDate((row as any).completion_date):'Ongoing'}</span>
      </div>
      <div className="inspector-bar-track">
        <div ref={barRef} className="inspector-bar-fill" style={{background:bg}}/>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:10,fontSize:11,fontFamily:'var(--font-sans)'}}>
        <span style={{color:'var(--text-muted)'}}>Duration: <span style={{color:'var(--text-primary)',fontFamily:'var(--font-mono)'}}>{Math.round(totalDays)} days</span></span>
        <span style={{color:'var(--text-muted)'}}>Progress: <span style={{color:'#38BDF8',fontFamily:'var(--font-mono)'}}>{Math.round(progress)}%</span></span>
      </div>
    </div>
  );
}

function FinancialsSection({row}:{row:RpaRow}){
  const budgetBarRef=useRef<HTMLDivElement>(null);
  const savingsBarRef=useRef<HTMLDivElement>(null);
  const roiBarRef=useRef<HTMLDivElement>(null);
  const budget=row.budget_usd||0;
  const savings=row.annual_savings_usd||0;
  const total=budget+savings||1;
  const bPct=(budget/total)*100;
  const sPct=(savings/total)*100;
  const roi=row.roi_percent||0;
  const roiColor=getRoiColor(roi);
  const roiFill=Math.min(Math.max(0,roi),500)/500*100;

  useEffect(()=>{
    // Budget bar
    if(budgetBarRef.current){budgetBarRef.current.style.width='0%';requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(budgetBarRef.current)budgetBarRef.current.style.width=bPct+'%';});});}
    // Savings bar
    if(savingsBarRef.current){savingsBarRef.current.style.width='0%';requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(savingsBarRef.current)savingsBarRef.current.style.width=sPct+'%';});});}
    // ROI bar
    if(roiBarRef.current){roiBarRef.current.style.width='0%';requestAnimationFrame(()=>{requestAnimationFrame(()=>{if(roiBarRef.current)roiBarRef.current.style.width=roiFill+'%';});});}
  },[row, bPct, sPct, roiFill]);

  return(
    <div className="inspector-section">
      <div className="inspector-section-label">Financials</div>
      {/* Budget vs Savings */}
      <div style={{background:'rgba(255,255,255,0.03)',borderRadius:8,padding:14,marginBottom:10}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
          <div><div className="inspector-stat-label" style={{marginBottom:2}}>Budget</div><div style={{fontSize:16,fontFamily:'var(--font-mono)',color:'var(--text-primary)'}}>{formatCurrency(budget)}</div></div>
          <div style={{textAlign:'right'}}><div className="inspector-stat-label" style={{marginBottom:2}}>Annual Savings</div><div style={{fontSize:16,fontFamily:'var(--font-mono)',color:'#4ADE80'}}>{formatCurrency(savings)}</div></div>
        </div>
        <div style={{height:8,borderRadius:99,overflow:'hidden',display:'flex',background:'rgba(255,255,255,0.04)'}}>
          <div ref={budgetBarRef} style={{width:'0%',background:'rgba(56,189,248,0.6)',borderRadius:'99px 0 0 99px',transition:'width 800ms cubic-bezier(0.4,0,0.2,1)'}}/>
          <div ref={savingsBarRef} style={{width:'0%',background:'rgba(74,222,128,0.6)',borderRadius:'0 99px 99px 0',transition:'width 800ms cubic-bezier(0.4,0,0.2,1)'}}/>
        </div>
        <div style={{display:'flex',gap:16,marginTop:8,fontSize:9,color:'var(--text-muted)'}}>
          <span><span style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:'rgba(56,189,248,0.6)',marginRight:4,verticalAlign:'middle'}}/>Budget</span>
          <span><span style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:'rgba(74,222,128,0.6)',marginRight:4,verticalAlign:'middle'}}/>Savings</span>
        </div>
      </div>
      {/* ROI Meter */}
      <div style={{background:'rgba(255,255,255,0.03)',borderRadius:8,padding:14}}>
        <div className="inspector-stat-label" style={{marginBottom:6}}>Return on Investment</div>
        <div style={{fontSize:28,fontFamily:'var(--font-mono)',fontWeight:600,color:roiColor,marginBottom:10}}>{formatROI(roi)}</div>
        <div className="inspector-bar-track">
          <div ref={roiBarRef} className="inspector-bar-fill" style={{background:roiColor}}/>
        </div>
        <div style={{marginTop:8,fontSize:10,fontFamily:'var(--font-mono)'}}>
          {roi>=0
            ?<span style={{color:'#4ADE80'}}>↑ {formatROI(roi)} above breakeven</span>
            :<span style={{color:'#F87171'}}>↓ {formatROI(Math.abs(roi))} below breakeven</span>}
        </div>
      </div>
    </div>
  );
}

function GearIcon(){
  return(<svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{flexShrink:0}}><circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2.5 1.5"/></svg>);
}

function OperationalSection({row}:{row:RpaRow}){
  const robots=row.robots_deployed||0;
  const hours=row.employee_hours_saved||0;
  const days=Math.round(hours/8);
  const weeks=Math.round(days/5);
  const showCount=Math.min(robots,10);
  return(
    <div className="inspector-section">
      <div className="inspector-section-label">Operational</div>
      <div className="inspector-stat-grid" style={{gap:20}}>
        <div>
          <div className="inspector-stat-label">Robots Deployed</div>
          <div style={{fontSize:20,fontFamily:'var(--font-mono)',color:'#38BDF8',margin:'6px 0 8px'}}>{robots}</div>
          <div style={{display:'flex',gap:3,flexWrap:'wrap',alignItems:'center',color:'#38BDF8'}}>
            {Array.from({length:showCount}).map((_,i)=><GearIcon key={i}/>)}
            {robots>10&&<span style={{fontSize:10,fontFamily:'var(--font-mono)',color:'var(--text-muted)',marginLeft:4}}>+{robots-10}</span>}
          </div>
        </div>
        <div>
          <div className="inspector-stat-label">Hours Saved</div>
          <div style={{fontSize:20,fontFamily:'var(--font-mono)',color:'#4ADE80',margin:'6px 0 8px'}}>{formatNumber(hours)} hrs</div>
          <div style={{fontSize:10,fontFamily:'var(--font-sans)',color:'var(--text-muted)'}}>{days} work days · {weeks} work weeks</div>
        </div>
      </div>
    </div>
  );
}

function InfrastructureSection({row}:{row:RpaRow}){
  const ai=(row as any).ai_enabled==='Yes';
  const cloud=(row as any).cloud_deployed==='Yes';
  return(
    <div className="inspector-section">
      <div className="inspector-section-label">Infrastructure</div>
      <div style={{display:'flex',gap:8}}>
        <div className={`infra-badge ${ai?'enabled':'disabled'}`}>
          <span style={{width:8,height:8,borderRadius:'50%',background:ai?'#4ADE80':'rgba(255,255,255,0.2)',flexShrink:0}}/>
          <span style={{fontSize:11,fontFamily:'var(--font-mono)',fontWeight:600,color:ai?'#4ADE80':'var(--text-muted)'}}>{ai?'AI ENABLED':'AI DISABLED'}</span>
        </div>
        <div className={`infra-badge ${cloud?'cloud-enabled':'disabled'}`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{flexShrink:0}}>
            <path d="M4 12h8a3 3 0 100-6h-.5A4 4 0 003.5 7 2.5 2.5 0 004 12z" stroke={cloud?'#38BDF8':'var(--text-muted)'} strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
          <span style={{fontSize:11,fontFamily:'var(--font-mono)',fontWeight:600,color:cloud?'#38BDF8':'var(--text-muted)'}}>{cloud?'CLOUD DEPLOYED':'ON-PREMISE'}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══ Main Component ═══ */

export default function InspectorPanel(){
  const[inspectedRow,setInspectedRow]=useState<RpaRow|null>(null);
  const[isVisible,setIsVisible]=useState(false);
  const[portalRoot,setPortalRoot]=useState<HTMLElement|null>(null);

  useEffect(()=>{
    setPortalRoot(document.getElementById('inspector-portal-root'));
    const unsub=inspectorController.subscribe((row)=>{
      if(row){
        setInspectedRow(row);
        requestAnimationFrame(()=>setIsVisible(true));
      }else{
        setIsVisible(false);
        setTimeout(()=>setInspectedRow(null),350);
      }
    });
    return unsub;
  },[]);

  const handleClose=()=>{
    inspectorController.closeInspector();
    document.querySelectorAll('.row-selected').forEach(el=>el.classList.remove('row-selected'));
  };

  if(!portalRoot||!inspectedRow)return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className={`inspector-backdrop${isVisible?' open':''}`} onClick={handleClose}/>
      {/* Panel */}
      <div className={`inspector-panel${isVisible?' open':''}`}>
        <InspectorHeader row={inspectedRow} onClose={handleClose}/>
        <div className="inspector-scroll" style={{overflowY:'auto',flex:1,paddingBottom:40}}>
          <IdentitySection row={inspectedRow}/>
          <TimelineSection row={inspectedRow}/>
          <FinancialsSection row={inspectedRow}/>
          <OperationalSection row={inspectedRow}/>
          <InfrastructureSection row={inspectedRow}/>
        </div>
      </div>
    </>,
    portalRoot
  );
}
