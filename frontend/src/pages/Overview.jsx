import { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import axios from 'axios'
import { usePeriod } from '../context.jsx'
import Alerts from '../components/Alerts.jsx'

const api = axios.create({ baseURL: '/api' })
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('bi_token'); if (t) cfg.headers['X-Token'] = t; return cfg
})

const fmt = n => !n ? '—' : n >= 1e8 ? (n/1e6).toFixed(0)+'М ₽' : n >= 1e6 ? (n/1e6).toFixed(1)+'М ₽' : Math.round(n/1000)+'К ₽'
const fmtN = n => n ? Math.round(n).toLocaleString('ru') : '—'

const TT = ({ active, payload, label }) => active && payload?.length
  ? <div style={{background:'#1a1d26',border:'1px solid rgba(255,255,255,.1)',borderRadius:8,padding:'8px 12px',fontSize:12}}>
      <div style={{color:'rgba(255,255,255,.5)',marginBottom:4}}>{label}</div>
      {payload.filter(p=>p.value!=null).map((p,i)=><div key={i} style={{color:p.color||'#fff'}}>{p.name}: {typeof p.value==='number'?p.value.toLocaleString('ru'):p.value}</div>)}
    </div> : null

export default function Overview() {
  const { dateFrom, dateTo } = usePeriod()
  const [summary, setSummary]   = useState(null)
  const [monthly, setMonthly]   = useState([])
  const [topTenants, setTop]    = useState([])

  useEffect(() => {
    // Real summary from turnover table
    api.get('/analytics/overview', {params:{period:dateTo}}).then(r=>setSummary(r.data)).catch(()=>{})

    // Monthly chart
    api.get('/analytics/traffic', {params:{months:48}}).then(r => {
      const filtered = r.data.filter(d => d.period >= dateFrom && d.period <= dateTo)
      setMonthly(filtered.map(d => ({
        period: d.period.slice(2),
        oborot: d.turnover ? Math.round(d.turnover/1e6) : null,
        traffic: d.traffic,
        avg_check: d.avg_check,
      })))
    }).catch(()=>{})

    // Top tenants
    api.get('/tenants/', {params:{date_from:dateFrom, date_to:dateTo}}).then(r=>setTop(r.data.slice(0,5))).catch(()=>{})
  }, [dateFrom, dateTo])

  const o = summary?.turnover || {}

  return (
    <div>
      <div className="page-header">
        <h2>Сводка</h2>
        <p>ПРИВОЗ · {dateFrom} — {dateTo}</p>
      </div>
      <Alerts />

      <div className="metrics">
        <div className="metric-card">
          <div className="label">Товарооборот</div>
          <div className="value">{fmt(o.turnover)}</div>
          {summary?.yoy_turnover != null && (
            <div className={`delta ${summary.yoy_turnover>=0?'delta-up':'delta-down'}`}>
              {summary.yoy_turnover>=0?'↑':'↓'} {Math.abs(summary.yoy_turnover)}% год к году
            </div>
          )}
        </div>
        <div className="metric-card">
          <div className="label">Посетителей</div>
          <div className="value">{fmtN(o.traffic)}</div>
          {summary?.yoy_traffic != null && (
            <div className={`delta ${summary.yoy_traffic>=0?'delta-up':'delta-down'}`}>
              {summary.yoy_traffic>=0?'↑':'↓'} {Math.abs(summary.yoy_traffic)}% YoY
            </div>
          )}
        </div>
        <div className="metric-card">
          <div className="label">Средний чек</div>
          <div className="value">{o.avg_check ? Math.round(o.avg_check)+' ₽' : '—'}</div>
        </div>
        <div className="metric-card">
          <div className="label">Новых посетителей</div>
          <div className="value">{o.new_pct ? o.new_pct+'%' : '—'}</div>
          <div className="delta delta-flat">{o.return_pct ? o.return_pct+'% повторных' : ''}</div>
        </div>
        <div className="metric-card">
          <div className="label">Активных арендаторов</div>
          <div className="value">{summary?.active_tenants || '—'}</div>
        </div>
        <div className="metric-card">
          <div className="label">Оборот YTD ({dateTo?.slice(0,4)})</div>
          <div className="value">{fmt(summary?.ytd_turnover)}</div>
          <div className="delta delta-flat">{fmtN(summary?.ytd_visits)} посещений</div>
        </div>
      </div>

      <div className="card">
        <h3>Товарооборот фудмолла, млн ₽</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="period" tick={{fontSize:10,fill:'rgba(255,255,255,.35)'}}/>
            <YAxis tick={{fontSize:10,fill:'rgba(255,255,255,.35)'}}/>
            <Tooltip content={<TT/>}/>
            <Area type="monotone" dataKey="oborot" stroke="#4f8ef7" fill="rgba(79,142,247,.1)" strokeWidth={2} name="Оборот (млн ₽)"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Трафик посетителей</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="period" tick={{fontSize:10,fill:'rgba(255,255,255,.35)'}}/>
              <YAxis tick={{fontSize:10,fill:'rgba(255,255,255,.35)'}} tickFormatter={v=>Math.round(v/1000)+'К'}/>
              <Tooltip content={<TT/>}/>
              <Bar dataKey="traffic" fill="#34d399" radius={[3,3,0,0]} name="Посетители"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3>Топ-5 арендаторов по обороту</h3>
          {topTenants.map((t,i) => (
            <div key={t.name} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
              <div style={{width:20,fontSize:11,color:'var(--text-2)',flexShrink:0,textAlign:'right'}}>{i+1}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:500,marginBottom:3}}>{t.name}</div>
                <div className="plan-bar">
                  <div className="plan-fill" style={{width:Math.round((t.turnover||0)/(topTenants[0]?.turnover||1)*100)+'%',background:'var(--accent)'}}/>
                </div>
              </div>
              <div style={{fontSize:12,color:'var(--accent)',fontWeight:500,flexShrink:0,minWidth:60,textAlign:'right'}}>{fmt(t.turnover||0)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
