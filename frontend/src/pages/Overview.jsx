import { useEffect, useState } from 'react'
import { BarChart,Bar,LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid,AreaChart,Area } from 'recharts'
import { getRevenueSummary, getRevenueMonthly, getTraffic, getAlerts } from '../api.js'
import { usePeriod } from '../context.jsx'
import Alerts from '../components/Alerts.jsx'

const fmt = n => n >= 1e6 ? (n/1e6).toFixed(1)+'М ₽' : Math.round(n/1000)+'К ₽'
const DOW = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб']
const TT = ({ active, payload, label }) => active && payload?.length
  ? <div style={{background:'#1a1d26',border:'1px solid rgba(255,255,255,.1)',borderRadius:8,padding:'8px 12px',fontSize:12}}>
      <div style={{color:'rgba(255,255,255,.5)',marginBottom:4}}>{label}</div>
      {payload.map((p,i) => <div key={i} style={{color:p.color}}>{p.name}: {typeof p.value === 'number' ? p.value.toLocaleString('ru') : p.value}</div>)}
    </div>
  : null

export default function Overview() {
  const { period, periods } = usePeriod()
  const [summary, setSummary] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [traffic, setTraffic] = useState(null)

  useEffect(() => {
    getRevenueSummary(period).then(setSummary).catch(()=>{})
    getRevenueMonthly().then(rows => {
      const agg = {}
      rows.forEach(r => { agg[r.period] = (agg[r.period]||0) + r.total })
      setMonthly(Object.entries(agg).map(([p,t]) => ({ period: p.slice(5), total: Math.round(t/1000) })))
    }).catch(()=>{})
    getTraffic().then(setTraffic).catch(()=>{})
  }, [period])

  const dowData = traffic?.by_dow?.map(r => ({ name: DOW[r.dow], count: r.avg_count })) || []

  return (
    <div>
      <div className="page-header"><h2>Сводка — {period}</h2><p>Все ключевые показатели фудмолла</p></div>
      <Alerts />
      <div className="metrics">
        <div className="metric-card">
          <div className="label">Выручка (аренда)</div>
          <div className="value">{summary ? fmt(summary.total) : '—'}</div>
          <div className="delta delta-up">↑ 8% к прошлому месяцу</div>
        </div>
        <div className="metric-card">
          <div className="label">% оплат вовремя</div>
          <div className="value">{summary ? summary.paid_pct + '%' : '—'}</div>
          <div className={`delta ${summary?.paid_pct >= 90 ? 'delta-up' : 'delta-down'}`}>
            {summary?.paid_pct >= 90 ? '✓ норма' : '↓ ниже нормы'}
          </div>
        </div>
        <div className="metric-card">
          <div className="label">Дебиторка</div>
          <div className="value">{summary ? fmt(summary.debt_total||0) : '—'}</div>
          <div className={`delta ${summary?.debt_total > 0 ? 'delta-down' : 'delta-flat'}`}>
            {summary?.debt_tenants?.length || 0} арендатора
          </div>
        </div>
        <div className="metric-card">
          <div className="label">Посетителей сегодня</div>
          <div className="value">{traffic?.today?.toLocaleString('ru') || '—'}</div>
          <div className="delta delta-up">↑ 6% ко вчера</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Выручка по месяцам, тыс. ₽</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tick={{fontSize:11,fill:'rgba(255,255,255,.35)'}} />
              <YAxis tick={{fontSize:11,fill:'rgba(255,255,255,.35)'}} />
              <Tooltip content={<TT/>} />
              <Bar dataKey="total" fill="#4f8ef7" radius={[4,4,0,0]} name="₽ тыс." />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3>Средний трафик по дням недели</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{fontSize:11,fill:'rgba(255,255,255,.35)'}} />
              <YAxis tick={{fontSize:11,fill:'rgba(255,255,255,.35)'}} />
              <Tooltip content={<TT/>} />
              <Bar dataKey="count" fill="#34d399" radius={[4,4,0,0]} name="Посетители" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {summary?.debt_tenants?.length > 0 && (
        <div className="card">
          <h3>Долги по арендаторам</h3>
          {summary.debt_tenants.map(t => (
            <div key={t.name} style={{marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                <span>{t.name}</span>
                <span style={{color:'var(--red)',fontWeight:500}}>{fmt(t.debt)}</span>
              </div>
              <div className="plan-bar">
                <div className="plan-fill" style={{width:Math.min(100,t.debt/3000)+'%',background:'var(--red)'}}/>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
