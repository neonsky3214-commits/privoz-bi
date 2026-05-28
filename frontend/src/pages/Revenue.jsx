import { useEffect, useState } from 'react'
import { BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid,PieChart,Pie,Cell } from 'recharts'
import { getRevenueMonthly, getRevenueSummary } from '../api.js'
import { usePeriod } from '../context.jsx'

const fmt = n => n >= 1e6 ? (n/1e6).toFixed(1)+'М ₽' : Math.round(n/1000)+'К ₽'
const TT = ({ active, payload, label }) => active && payload?.length
  ? <div style={{background:'#1a1d26',border:'1px solid rgba(255,255,255,.1)',borderRadius:8,padding:'8px 12px',fontSize:12}}>
      <div style={{color:'rgba(255,255,255,.5)',marginBottom:4}}>{label}</div>
      {payload.map((p,i)=><div key={i} style={{color:p.color}}>{p.name}: {p.value?.toLocaleString?.('ru') ?? p.value}</div>)}
    </div> : null

export default function Revenue() {
  const { period } = usePeriod()
  const [summary, setSummary] = useState(null)
  const [monthly, setMonthly] = useState([])

  useEffect(() => {
    getRevenueSummary(period).then(setSummary).catch(()=>{})
    getRevenueMonthly().then(rows => {
      const agg = {}
      rows.forEach(r => {
        if (!agg[r.period]) agg[r.period] = { period: r.period.slice(5), rent:0, other:0 }
        if (r.type === 'rent') agg[r.period].rent += Math.round(r.total/1000)
        else agg[r.period].other += Math.round(r.total/1000)
      })
      setMonthly(Object.values(agg))
    }).catch(()=>{})
  }, [period])

  const pie = [{name:'Аренда',value:74,color:'#4f8ef7'},{name:'Реклама',value:14,color:'#34d399'},{name:'Мероприятия',value:12,color:'#fbbf24'}]

  return (
    <div>
      <div className="page-header"><h2>Выручка</h2><p>Динамика платежей · {period}</p></div>
      <div className="metrics" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
        <div className="metric-card"><div className="label">Аренда (факт)</div><div className="value">{summary?fmt(summary.total):'—'}</div><div className="delta delta-up">↑ 7% к прошлому</div></div>
        <div className="metric-card"><div className="label">% оплат вовремя</div><div className="value">{summary?.paid_pct??'—'}%</div><div className={`delta ${(summary?.paid_pct||0)>=90?'delta-up':'delta-down'}`}>{(summary?.paid_pct||0)>=90?'норма':'ниже нормы'}</div></div>
        <div className="metric-card"><div className="label">Дебиторка</div><div className="value">{summary?fmt(summary.debt_total||0):'—'}</div><div className="delta delta-down">{summary?.debt_tenants?.length||0} арендатора</div></div>
      </div>
      <div className="card"><h3>Выручка по месяцам, тыс. ₽</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="period" tick={{fontSize:11,fill:'rgba(255,255,255,.35)'}}/>
            <YAxis tick={{fontSize:11,fill:'rgba(255,255,255,.35)'}}/>
            <Tooltip content={<TT/>}/>
            <Bar dataKey="rent" stackId="a" fill="#4f8ef7" name="Аренда"/>
            <Bar dataKey="other" stackId="a" fill="#34d399" name="Прочее" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid-2">
        <div className="card"><h3>Структура доходов</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart><Pie data={pie} dataKey="value" cx="50%" cy="50%" outerRadius={70} label={({name,value})=>`${name} ${value}%`} labelLine={false}>
              {pie.map((e,i)=><Cell key={i} fill={e.color}/>)}
            </Pie><Tooltip/></PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card"><h3>Топ должников</h3>
          {(summary?.debt_tenants||[]).map(t=>(
            <div key={t.name} style={{marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}><span>{t.name}</span><span style={{color:'var(--red)',fontWeight:500}}>{fmt(t.debt)}</span></div>
              <div className="plan-bar"><div className="plan-fill" style={{width:Math.min(100,t.debt/2000)+'%',background:'var(--red)'}}/></div>
            </div>
          ))}
          {(!summary?.debt_tenants?.length) && <div style={{color:'var(--green)',fontSize:13}}>✓ Долгов нет</div>}
        </div>
      </div>
    </div>
  )
}
