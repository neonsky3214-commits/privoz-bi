import { useEffect, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ComposedChart, Legend
} from 'recharts'
import axios from 'axios'
import { usePeriod } from '../context.jsx'

const api = axios.create({ baseURL: '/api' })
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('bi_token'); if (t) cfg.headers['X-Token'] = t; return cfg
})

const fmt  = n => n ? (n >= 1e8 ? (n/1e6).toFixed(0)+'М ₽' : n >= 1e6 ? (n/1e6).toFixed(1)+'М ₽' : Math.round(n/1000)+'К ₽') : '—'
const fmtN = n => n ? n.toLocaleString('ru') : '—'

const TT = ({ active, payload, label }) => active && payload?.length
  ? <div style={{background:'#1a1d26',border:'1px solid rgba(255,255,255,.1)',borderRadius:8,padding:'8px 12px',fontSize:12}}>
      <div style={{color:'rgba(255,255,255,.5)',marginBottom:4}}>{label}</div>
      {payload.filter(p=>p.value!=null).map((p,i)=>
        <div key={i} style={{color:p.color||'#fff'}}>{p.name}: {typeof p.value === 'number' ? p.value.toLocaleString('ru') : p.value}</div>
      )}
    </div> : null

const PERIODS = ['2025-12','2025-11','2025-10','2025-09','2025-08','2025-07','2025-06','2025-05','2025-04','2025-03','2025-02','2025-01']
const YEAR_COLORS = {'2022':'rgba(100,116,139,.6)','2023':'rgba(167,139,250,.8)','2024':'rgba(251,191,36,.9)','2025':'#4f8ef7'}

export default function Analytics() {
  const { dateFrom, dateTo } = usePeriod()
  // period from context
  const [overview, setOverview]   = useState(null)
  const [tenants, setTenants]     = useState([])
  const [traffic, setTraffic]     = useState([])
  const [season, setSeason]       = useState([])
  const [newVsRet, setNewVsRet]   = useState([])
  const [selTenant, setSelTenant] = useState('Bagetteria')
  const [tenantHist, setTenantHist] = useState([])
  const [tenantList, setTenantList] = useState([])
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    api.get('/analytics/overview', {params:{period}}).then(r=>setOverview(r.data)).catch(()=>{})
    api.get('/analytics/tenants', {params:{period:period.slice(0,4)}}).then(r=>setTenants(r.data)).catch(()=>{})
  }, [period])

  useEffect(() => {
    api.get('/analytics/traffic', {params:{months:24}}).then(r=>setTraffic(r.data)).catch(()=>{})
    api.get('/analytics/seasonality').then(r=>setSeason(r.data)).catch(()=>{})
    api.get('/analytics/new-vs-return', {params:{months:24}}).then(r=>setNewVsRet(r.data)).catch(()=>{})
    api.get('/analytics/tenant-list').then(r=>setTenantList(r.data)).catch(()=>{})
  }, [])

  useEffect(() => {
    if (selTenant) api.get('/analytics/tenant-history', {params:{tenant:selTenant}}).then(r=>setTenantHist(r.data)).catch(()=>{})
  }, [selTenant])

  const o = overview
  const trafficChart = traffic.map(r => ({
    period: r.period.slice(5), traffic: r.traffic, avg_check: r.avg_check, turnover: r.turnover ? Math.round(r.turnover/1e6) : null
  }))
  const tenantChart  = tenants.slice(0,12).map(r => ({name: r.tenant.slice(0,12), value: Math.round(r.turnover/1e6)}))
  const histChart    = tenantHist.map(r => ({period: r.period.slice(5), turnover: r.turnover ? Math.round(r.turnover/1e3) : null, avg_check: r.avg_check}))

  return (
    <div>
      <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div><h2>Аналитика фудмолла</h2><p>Реальные данные 2022–2025 · 56 арендаторов</p></div>
        <select className="sel" value={period} onChange={e=>setPeriod(e.target.value)}>
          {PERIODS.map(p=><option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* KPI row */}
      <div className="metrics">
        <div className="metric-card">
          <div className="label">Товарооборот</div>
          <div className="value">{o ? fmt(o.turnover?.turnover) : '—'}</div>
          {o?.yoy_turnover != null && <div className={`delta ${o.yoy_turnover>=0?'delta-up':'delta-down'}`}>{o.yoy_turnover>=0?'↑':'↓'} {Math.abs(o.yoy_turnover)}% год к году</div>}
        </div>
        <div className="metric-card">
          <div className="label">Трафик</div>
          <div className="value">{o ? fmtN(o.turnover?.traffic) : '—'}</div>
          {o?.yoy_traffic != null && <div className={`delta ${o.yoy_traffic>=0?'delta-up':'delta-down'}`}>{o.yoy_traffic>=0?'↑':'↓'} {Math.abs(o.yoy_traffic)}% YoY</div>}
        </div>
        <div className="metric-card">
          <div className="label">Средний чек</div>
          <div className="value">{o?.turnover?.avg_check ? Math.round(o.turnover.avg_check)+' ₽' : '—'}</div>
        </div>
        <div className="metric-card">
          <div className="label">Новые посетители</div>
          <div className="value">{o?.turnover?.new_pct ? o.turnover.new_pct+'%' : '—'}</div>
          <div className="delta delta-flat">{o?.turnover?.return_pct ? o.turnover.return_pct+'% повторных' : ''}</div>
        </div>
        <div className="metric-card">
          <div className="label">Арендаторов активных</div>
          <div className="value">{o?.active_tenants || '—'}</div>
        </div>
        <div className="metric-card">
          <div className="label">Оборот за {period.slice(0,4)}</div>
          <div className="value">{o ? fmt(o.ytd_turnover) : '—'}</div>
          <div className="delta delta-flat">{o ? fmtN(o.ytd_visits)+' посещений' : ''}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:0,borderBottom:'1px solid var(--border)',marginBottom:14}}>
        {[['overview','Динамика'],['tenants','Арендаторы'],['seasonality','Сезонность'],['audience','Аудитория'],['tenant-detail','Детализация']].map(([k,l])=>(
          <div key={k} onClick={()=>setTab(k)} style={{padding:'7px 16px',cursor:'pointer',fontSize:12,color:tab===k?'var(--accent)':'var(--text-2)',borderBottom:tab===k?'2px solid var(--accent)':'2px solid transparent',marginBottom:-1,transition:'all .15s'}}>{l}</div>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab==='overview' && <>
        <div className="card">
          <h3>Товарооборот фудмолла, млн ₽</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trafficChart}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="period" tick={{fontSize:10,fill:'rgba(255,255,255,.35)'}}/>
              <YAxis tick={{fontSize:10,fill:'rgba(255,255,255,.35)'}}/>
              <Tooltip content={<TT/>}/>
              <Area type="monotone" dataKey="turnover" stroke="#4f8ef7" fill="rgba(79,142,247,.1)" strokeWidth={2} name="Оборот (млн ₽)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="grid-2">
          <div className="card">
            <h3>Трафик посетителей</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={trafficChart}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="period" tick={{fontSize:10,fill:'rgba(255,255,255,.35)'}}/>
                <YAxis tick={{fontSize:10,fill:'rgba(255,255,255,.35)'}} tickFormatter={v=>Math.round(v/1000)+'К'}/>
                <Tooltip content={<TT/>}/>
                <Bar dataKey="traffic" fill="#34d399" radius={[3,3,0,0]} name="Посетители"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3>Средний чек, ₽</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trafficChart}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="period" tick={{fontSize:10,fill:'rgba(255,255,255,.35)'}}/>
                <YAxis tick={{fontSize:10,fill:'rgba(255,255,255,.35)'}} domain={['auto','auto']}/>
                <Tooltip content={<TT/>}/>
                <Line type="monotone" dataKey="avg_check" stroke="#fbbf24" strokeWidth={2} dot={false} name="Ср. чек ₽"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>}

      {/* TENANTS TAB */}
      {tab==='tenants' && <>
        <div className="card">
          <h3>Топ арендаторов по товарообороту {period.slice(0,4)}, млн ₽</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tenantChart} layout="vertical" margin={{left:20}}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis type="number" tick={{fontSize:10,fill:'rgba(255,255,255,.35)'}}/>
              <YAxis type="category" dataKey="name" tick={{fontSize:11,fill:'rgba(255,255,255,.6)'}} width={120}/>
              <Tooltip content={<TT/>}/>
              <Bar dataKey="value" fill="#4f8ef7" radius={[0,4,4,0]} name="Оборот (млн ₽)"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <table className="bi-table">
            <thead><tr><th>#</th><th>Арендатор</th><th>Оборот {period.slice(0,4)}</th><th>Ср. чек</th></tr></thead>
            <tbody>
              {tenants.slice(0,15).map((t,i)=>(
                <tr key={t.tenant} style={{cursor:'pointer'}} onClick={()=>{setSelTenant(t.tenant);setTab('tenant-detail')}}>
                  <td style={{color:'var(--text-2)',width:36}}>{i+1}</td>
                  <td style={{fontWeight:500}}>{t.tenant}</td>
                  <td style={{color:'var(--accent)'}}>{fmt(t.turnover)}</td>
                  <td>{t.avg_check ? Math.round(t.avg_check)+' ₽' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>}

      {/* SEASONALITY TAB */}
      {tab==='seasonality' && <>
        <div className="card">
          <h3>Сезонность товарооборота — сравнение по годам, млн ₽</h3>
          <div style={{display:'flex',gap:12,marginBottom:10,fontSize:12,flexWrap:'wrap'}}>
            {Object.entries(YEAR_COLORS).map(([y,c])=>(
              <span key={y} style={{display:'flex',alignItems:'center',gap:6,color:'var(--text-2)'}}>
                <span style={{width:16,height:3,background:c,display:'inline-block',borderRadius:2}}/>
                {y}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={season}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="month" tick={{fontSize:11,fill:'rgba(255,255,255,.35)'}}/>
              <YAxis tick={{fontSize:10,fill:'rgba(255,255,255,.35)'}} tickFormatter={v=>v?Math.round(v/1e6)+'М':''}/>
              <Tooltip content={<TT/>} formatter={v=>v?fmt(v):null}/>
              {Object.entries(YEAR_COLORS).map(([y,c])=>(
                <Line key={y} type="monotone" dataKey={y} stroke={c} strokeWidth={2} dot={false} name={y} connectNulls/>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3>Лучшие и худшие месяцы по обороту</h3>
          {season.filter(r=>r['2025']).sort((a,b)=>b['2025']-a['2025']).map((r,i)=>(
            <div key={r.month} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
              <div style={{width:32,fontSize:12,color:'var(--text-2)',flexShrink:0}}>{r.month}</div>
              <div style={{flex:1}}>
                <div className="plan-bar">
                  <div className="plan-fill" style={{width:Math.round(r['2025']/season.reduce((m,x)=>Math.max(m,x['2025']||0),0)*100)+'%',background: i<3?'var(--green)':i>8?'var(--red)':'var(--accent)'}}/>
                </div>
              </div>
              <div style={{fontSize:12,fontWeight:500,width:80,textAlign:'right',color:i<3?'var(--green)':i>8?'var(--red)':'var(--text)'}}>{fmt(r['2025'])}</div>
            </div>
          ))}
        </div>
      </>}

      {/* AUDIENCE TAB */}
      {tab==='audience' && <>
        <div className="card">
          <h3>Новые vs Повторные посетители</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={newVsRet}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="period" tick={{fontSize:10,fill:'rgba(255,255,255,.35)'}} tickFormatter={v=>v?.slice(2)}/>
              <YAxis tick={{fontSize:10,fill:'rgba(255,255,255,.35)'}} domain={[0,100]} tickFormatter={v=>v+'%'}/>
              <Tooltip content={<TT/>} formatter={v=>v+'%'}/>
              <Area type="monotone" dataKey="new_pct" stackId="1" stroke="#4f8ef7" fill="rgba(79,142,247,.3)" name="Новые %"/>
              <Area type="monotone" dataKey="return_pct" stackId="1" stroke="#34d399" fill="rgba(52,211,153,.3)" name="Повторные %"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="grid-2">
          <div className="card">
            <h3>Динамика трафика</h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={newVsRet}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="period" tick={{fontSize:10,fill:'rgba(255,255,255,.35)'}} tickFormatter={v=>v?.slice(2)}/>
                <YAxis tick={{fontSize:10,fill:'rgba(255,255,255,.35)'}} tickFormatter={v=>Math.round(v/1000)+'К'}/>
                <Tooltip content={<TT/>}/>
                <Area type="monotone" dataKey="traffic" stroke="#fbbf24" fill="rgba(251,191,36,.1)" strokeWidth={2} name="Трафик"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3>Лояльность аудитории</h3>
            <div style={{fontSize:13,marginTop:4}}>
              {newVsRet.slice(-3).map(r=>(
                <div key={r.period} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                  <span style={{color:'var(--text-2)'}}>{r.period}</span>
                  <span>
                    <span style={{color:'var(--accent)',marginRight:12}}>↩ {r.return_pct}% повторных</span>
                    <span style={{color:'var(--text-2)'}}>{fmtN(r.traffic)} чел.</span>
                  </span>
                </div>
              ))}
              <div style={{marginTop:12,fontSize:12,color:'var(--text-2)',lineHeight:1.7}}>
                Доля повторных посетителей ~{Math.round(newVsRet.slice(-3).reduce((s,r)=>s+(r.return_pct||0),0)/3)}% — 
                это здоровый показатель для фудмолла. Для роста нужно удерживать выше 30%.
              </div>
            </div>
          </div>
        </div>
      </>}

      {/* TENANT DETAIL TAB */}
      {tab==='tenant-detail' && <>
        <div className="filter-bar">
          <span>Арендатор:</span>
          <select className="sel" value={selTenant} onChange={e=>setSelTenant(e.target.value)} style={{minWidth:180}}>
            {tenantList.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {histChart.length > 0 && <>
          <div className="card">
            <h3>Товарооборот {selTenant} по месяцам, тыс. ₽</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={histChart}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="period" tick={{fontSize:10,fill:'rgba(255,255,255,.35)'}} tickFormatter={v=>v?.slice(2)}/>
                <YAxis tick={{fontSize:10,fill:'rgba(255,255,255,.35)'}}/>
                <Tooltip content={<TT/>}/>
                <Area type="monotone" dataKey="turnover" stroke="#4f8ef7" fill="rgba(79,142,247,.1)" strokeWidth={2} name="Оборот (тыс. ₽)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3>Средний чек {selTenant}, ₽</h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={histChart}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="period" tick={{fontSize:10,fill:'rgba(255,255,255,.35)'}} tickFormatter={v=>v?.slice(2)}/>
                <YAxis tick={{fontSize:10,fill:'rgba(255,255,255,.35)'}} domain={['auto','auto']}/>
                <Tooltip content={<TT/>}/>
                <Line type="monotone" dataKey="avg_check" stroke="#fbbf24" strokeWidth={2} dot={false} name="Ср. чек ₽"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>}
      </>}
    </div>
  )
}
