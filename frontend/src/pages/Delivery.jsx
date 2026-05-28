import { useEffect, useState } from 'react'
import { LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid } from 'recharts'
import { getDelivery } from '../api.js'
import { usePeriod } from '../context.jsx'

const TT = ({ active, payload, label }) => active && payload?.length
  ? <div style={{background:'#1a1d26',border:'1px solid rgba(255,255,255,.1)',borderRadius:8,padding:'8px 12px',fontSize:12}}>
      <div style={{color:'rgba(255,255,255,.5)',marginBottom:4}}>{label}</div>
      {payload.map((p,i)=><div key={i} style={{color:p.color}}>{p.name}: {p.value?.toLocaleString?.('ru')}</div>)}
    </div> : null

const LABELS = {yandex:'Яндекс Еда',dc:'Delivery Club',self:'Самовывоз'}
const COLORS = {yandex:'#4f8ef7',dc:'#f87171',self:'#34d399'}
const fmt = n => n ? Math.round(n).toLocaleString('ru')+' ₽' : '—'

export default function Delivery() {
  const { period } = usePeriod()
  const [data, setData] = useState(null)
  useEffect(() => { getDelivery(period).then(setData).catch(()=>{}) }, [period])
  const platforms = data?.by_platform || []
  const daily = {}
  ;(data?.daily||[]).forEach(r => {
    const d = r.order_date.slice(8)
    if (!daily[d]) daily[d] = {day:d}
    daily[d][r.platform] = r.orders
  })
  const dailyArr = Object.values(daily).slice(-14)
  const totalOrders = platforms.reduce((s,p) => s+p.orders, 0)
  const totalRev    = platforms.reduce((s,p) => s+p.revenue, 0)
  return (
    <div>
      <div className="page-header"><h2>Доставка</h2><p>Агрегаторы, рейтинги · {period}</p></div>
      <div className="metrics">
        <div className="metric-card"><div className="label">Всего заказов</div><div className="value">{totalOrders.toLocaleString('ru')}</div><div className="delta delta-up">↑ 5%</div></div>
        <div className="metric-card"><div className="label">Выручка доставки</div><div className="value">{fmt(totalRev)}</div><div className="delta delta-up">↑ 5%</div></div>
        {platforms.map(p => (
          <div key={p.platform} className="metric-card">
            <div className="label">{LABELS[p.platform]}</div>
            <div className="value">{p.orders?.toLocaleString('ru')}</div>
            <div className="delta delta-flat">ср. чек {Math.round(p.avg_check)} ₽ · ★ {p.avg_rating}</div>
          </div>
        ))}
      </div>
      <div className="card"><h3>Динамика заказов</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={dailyArr}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="day" tick={{fontSize:11,fill:'rgba(255,255,255,.35)'}}/>
            <YAxis tick={{fontSize:11,fill:'rgba(255,255,255,.35)'}}/>
            <Tooltip content={<TT/>}/>
            {['yandex','dc','self'].map(p => <Line key={p} type="monotone" dataKey={p} stroke={COLORS[p]} strokeWidth={2} dot={false} name={LABELS[p]}/>)}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
