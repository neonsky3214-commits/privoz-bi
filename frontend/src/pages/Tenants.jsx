import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import axios from 'axios'

const api = axios.create({ baseURL: '/api' })
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('bi_token'); if (t) cfg.headers['X-Token'] = t; return cfg
})

const fmt  = n => n >= 1e8 ? (n/1e6).toFixed(0)+'М ₽' : n >= 1e6 ? (n/1e6).toFixed(1)+'М ₽' : n >= 1e3 ? Math.round(n/1000)+'К ₽' : n+'₽'
const fmtN = n => n ? Math.round(n).toLocaleString('ru') : '—'

const TT = ({ active, payload, label }) => active && payload?.length
  ? <div style={{background:'#1a1d26',border:'1px solid rgba(255,255,255,.1)',borderRadius:8,padding:'8px 12px',fontSize:12}}>
      <div style={{color:'rgba(255,255,255,.5)',marginBottom:4}}>{label}</div>
      {payload.map((p,i)=><div key={i} style={{color:p.color||'#fff'}}>{p.name}: {p.value?.toLocaleString?.('ru')}</div>)}
    </div> : null

export default function Tenants() {
  const [tenants, setTenants]     = useState([])
  const [periods, setPeriods]     = useState([])
  const [dateFrom, setDateFrom]   = useState('2025-01')
  const [dateTo, setDateTo]       = useState('2025-12')
  const [loading, setLoading]     = useState(false)
  const [tab, setTab]             = useState('table')
  const [plans, setPlans]         = useState({})
  const [editPlan, setEditPlan]   = useState(null)
  const [planVal, setPlanVal]     = useState('')

  useEffect(() => {
    api.get('/tenants/periods').then(r => {
      setPeriods(r.data)
      if (r.data.length) {
        setDateFrom(r.data[0])
        setDateTo(r.data[r.data.length-1])
      }
    }).catch(()=>{})
  }, [])

  useEffect(() => {
    if (!dateFrom || !dateTo) return
    setLoading(true)
    api.get('/tenants/', {params:{date_from:dateFrom, date_to:dateTo}})
      .then(r => { setTenants(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [dateFrom, dateTo])

  const top10 = tenants.slice(0,10)
  const chartData = top10.map(t => ({name: t.name.slice(0,14), value: Math.round((t.turnover||0)/1e6)}))

  function planPct(name, turnover) {
    const plan = plans[name]
    if (!plan) return null
    return Math.round(turnover / plan * 100)
  }

  return (
    <div>
      <div className="page-header"><h2>Арендаторы</h2><p>{tenants.length} точек · реальные данные из отчёта</p></div>

      {/* Date filter */}
      <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:'14px 18px',marginBottom:16,display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{fontSize:11,color:'var(--text-2)',textTransform:'uppercase',letterSpacing:'.06em'}}>Период</div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:12,color:'var(--text-2)'}}>с</span>
          <select className="sel" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}>
            {periods.map(p=><option key={p} value={p}>{p}</option>)}
          </select>
          <span style={{fontSize:12,color:'var(--text-2)'}}>по</span>
          <select className="sel" value={dateTo} onChange={e=>setDateTo(e.target.value)}>
            {periods.map(p=><option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {/* Quick presets */}
        <div style={{display:'flex',gap:6,marginLeft:'auto'}}>
          {[
            ['2025','2025-01','2025-12'],
            ['2024','2024-01','2024-12'],
            ['6 мес','2025-07','2025-12'],
            ['3 мес','2025-10','2025-12'],
          ].map(([label,from,to])=>(
            <button key={label} onClick={()=>{setDateFrom(from);setDateTo(to)}}
              style={{padding:'4px 10px',fontSize:11,borderRadius:6,border:'1px solid var(--border)',background:dateFrom===from&&dateTo===to?'var(--accent-dim)':'transparent',color:dateFrom===from&&dateTo===to?'var(--accent)':'var(--text-2)',cursor:'pointer',fontFamily:'Onest,sans-serif'}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      {tenants.length > 0 && (
        <div className="metrics" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:16}}>
          <div className="metric-card">
            <div className="label">Всего арендаторов</div>
            <div className="value">{tenants.length}</div>
          </div>
          <div className="metric-card">
            <div className="label">Суммарный оборот</div>
            <div className="value">{fmt(tenants.reduce((s,t)=>s+(t.turnover||0),0))}</div>
          </div>
          <div className="metric-card">
            <div className="label">Средний чек по всем</div>
            <div className="value">{Math.round(tenants.reduce((s,t)=>s+(t.avg_check||0),0)/tenants.filter(t=>t.avg_check).length)} ₽</div>
          </div>
          <div className="metric-card">
            <div className="label">Лидер по обороту</div>
            <div className="value" style={{fontSize:14}}>{tenants[0]?.name||'—'}</div>
            <div className="delta delta-up">{fmt(tenants[0]?.turnover||0)}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{display:'flex',gap:0,borderBottom:'1px solid var(--border)',marginBottom:14}}>
        {[['table','Таблица'],['chart','График'],['plan','Plan vs Fact']].map(([k,l])=>(
          <div key={k} onClick={()=>setTab(k)}
            style={{padding:'7px 16px',cursor:'pointer',fontSize:12,color:tab===k?'var(--accent)':'var(--text-2)',borderBottom:tab===k?'2px solid var(--accent)':'2px solid transparent',marginBottom:-1,transition:'all .15s'}}>
            {l}
          </div>
        ))}
      </div>

      {loading && <div className="loading">Загрузка...</div>}

      {!loading && tab==='table' && (
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <table className="bi-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Арендатор</th>
                <th>Товарооборот</th>
                <th>Ср. чек</th>
                <th>Трафик</th>
                <th>Новых %</th>
                <th>Мес. данных</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t,i) => (
                <tr key={t.name}>
                  <td style={{color:'var(--text-2)',width:36}}>{i+1}</td>
                  <td style={{fontWeight:500}}>{t.name}</td>
                  <td style={{color:'var(--accent)',fontWeight:500}}>{fmt(t.turnover||0)}</td>
                  <td>{t.avg_check ? fmtN(t.avg_check)+' ₽' : '—'}</td>
                  <td>{t.traffic ? fmtN(t.traffic) : '—'}</td>
                  <td>{t.new_pct ? t.new_pct+'%' : '—'}</td>
                  <td style={{color:'var(--text-2)'}}>{t.months_active}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab==='chart' && (
        <div className="card">
          <h3>Топ-10 по товарообороту, млн ₽</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} layout="vertical" margin={{left:10}}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis type="number" tick={{fontSize:10,fill:'rgba(255,255,255,.35)'}}/>
              <YAxis type="category" dataKey="name" tick={{fontSize:11,fill:'rgba(255,255,255,.6)'}} width={130}/>
              <Tooltip content={<TT/>}/>
              <Bar dataKey="value" fill="#4f8ef7" radius={[0,4,4,0]} name="Оборот (млн ₽)"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && tab==='plan' && (
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <table className="bi-table">
            <thead><tr><th>Арендатор</th><th>Факт</th><th>План (₽)</th><th>% выполнения</th></tr></thead>
            <tbody>
              {tenants.slice(0,20).map(t => {
                const pct = planPct(t.name, t.turnover||0)
                return (
                  <tr key={t.name}>
                    <td style={{fontWeight:500}}>{t.name}</td>
                    <td style={{color:'var(--accent)'}}>{fmt(t.turnover||0)}</td>
                    <td>
                      {editPlan === t.name
                        ? <div style={{display:'flex',gap:6}}>
                            <input className="inp" value={planVal} onChange={e=>setPlanVal(e.target.value)}
                              style={{width:120,padding:'4px 8px',fontSize:12}} autoFocus
                              onKeyDown={e=>{if(e.key==='Enter'){setPlans(p=>({...p,[t.name]:parseFloat(planVal)}));setEditPlan(null)}}}/>
                            <button className="btn btn-primary" style={{padding:'4px 10px',fontSize:12}}
                              onClick={()=>{setPlans(p=>({...p,[t.name]:parseFloat(planVal)}));setEditPlan(null)}}>✓</button>
                          </div>
                        : <span style={{cursor:'pointer',color:'var(--text-2)'}}
                            onClick={()=>{setEditPlan(t.name);setPlanVal(plans[t.name]||'')}}>
                            {plans[t.name] ? fmt(plans[t.name]) : <span style={{color:'rgba(255,255,255,.15)'}}>+ задать план</span>}
                          </span>
                      }
                    </td>
                    <td>
                      {pct !== null
                        ? <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <div className="plan-bar" style={{width:80}}>
                              <div className="plan-fill" style={{width:Math.min(100,pct)+'%',background:pct>=100?'var(--green)':pct>=70?'var(--amber)':'var(--red)'}}/>
                            </div>
                            <span style={{fontSize:12,fontWeight:500,color:pct>=100?'var(--green)':pct>=70?'var(--amber)':'var(--red)'}}>{pct}%</span>
                          </div>
                        : <span style={{color:'rgba(255,255,255,.15)',fontSize:12}}>—</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
