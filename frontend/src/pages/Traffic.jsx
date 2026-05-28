import { useEffect, useState } from 'react'
import { AreaChart,Area,BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid } from 'recharts'
import { getTraffic } from '../api.js'

const TT = ({ active, payload, label }) => active && payload?.length
  ? <div style={{background:'#1a1d26',border:'1px solid rgba(255,255,255,.1)',borderRadius:8,padding:'8px 12px',fontSize:12}}>
      <div style={{color:'rgba(255,255,255,.5)',marginBottom:4}}>{label}</div>
      {payload.map((p,i)=><div key={i} style={{color:p.color}}>{p.name}: {p.value?.toLocaleString?.('ru')}</div>)}
    </div> : null

export default function Traffic() {
  const [data, setData] = useState(null)
  useEffect(() => { getTraffic().then(setData).catch(()=>{}) }, [])
  const hourly = data?.hourly?.map(r=>({hour:r.hour+':00',count:r.avg_count}))||[]
  const daily  = data?.monthly?.slice(-14).map(r=>({day:r.day.slice(8),total:r.total}))||[]
  return (
    <div>
      <div className="page-header"><h2>Трафик и посещаемость</h2><p>Счётчики посетителей, часовая динамика</p></div>
      <div className="metrics">
        <div className="metric-card"><div className="label">Сегодня</div><div className="value">{data?.today?.toLocaleString('ru')||'—'}</div><div className="delta delta-up">↑ 6%</div></div>
        <div className="metric-card"><div className="label">Пиковый час</div><div className="value">18–20ч</div><div className="delta">~340/ч</div></div>
        <div className="metric-card"><div className="label">Конверсия</div><div className="value">68%</div><div className="delta delta-up">↑ 3%</div></div>
      </div>
      <div className="card"><h3>Часовой трафик (среднее)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={hourly}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="hour" tick={{fontSize:11,fill:'rgba(255,255,255,.35)'}}/>
            <YAxis tick={{fontSize:11,fill:'rgba(255,255,255,.35)'}}/>
            <Tooltip content={<TT/>}/>
            <Area type="monotone" dataKey="count" stroke="#4f8ef7" fill="rgba(79,142,247,.1)" strokeWidth={2} name="Посетители"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="card"><h3>Дневной трафик, последние 2 нед.</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={daily}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="day" tick={{fontSize:11,fill:'rgba(255,255,255,.35)'}}/>
            <YAxis tick={{fontSize:11,fill:'rgba(255,255,255,.35)'}}/>
            <Tooltip content={<TT/>}/>
            <Bar dataKey="total" fill="#34d399" radius={[4,4,0,0]} name="Посетители"/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
