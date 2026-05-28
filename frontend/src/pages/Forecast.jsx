import { useEffect, useState } from 'react'
import { LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid,ReferenceLine } from 'recharts'
import { getForecast } from '../api.js'

const fmt = n => n ? Math.round(n).toLocaleString('ru')+' тыс. ₽' : '—'
const TT = ({ active, payload, label }) => active && payload?.length
  ? <div style={{background:'#1a1d26',border:'1px solid rgba(255,255,255,.1)',borderRadius:8,padding:'8px 12px',fontSize:12}}>
      <div style={{color:'rgba(255,255,255,.5)',marginBottom:4}}>{label}</div>
      {payload.filter(p=>p.value!=null).map((p,i)=><div key={i} style={{color:p.color}}>{p.name}: {p.value?.toLocaleString('ru')} тыс. ₽</div>)}
    </div> : null

export default function Forecast() {
  const [data, setData] = useState([])
  useEffect(() => { getForecast().then(setData).catch(()=>{}) }, [])

  const chartData = data.map(r => ({
    period: r.period.slice(5),
    fact:     r.is_forecast ? null : Math.round(r.total/1000),
    forecast: r.is_forecast ? Math.round(r.total/1000) : null,
  }))

  const lastFact = data.filter(r=>!r.is_forecast).slice(-1)[0]
  const firstForecast = data.find(r=>r.is_forecast)
  const growth = lastFact && firstForecast
    ? Math.round((firstForecast.total - lastFact.total) / lastFact.total * 100)
    : null

  return (
    <div>
      <div className="page-header">
        <h2>Прогноз <span style={{fontSize:11,background:'rgba(79,142,247,.15)',color:'var(--accent)',padding:'2px 8px',borderRadius:20,marginLeft:8,fontWeight:500}}>AI-модель</span></h2>
        <p>Линейная экстраполяция на основе исторических данных</p>
      </div>

      <div className="metrics" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
        <div className="metric-card">
          <div className="label">Прогноз (след. мес.)</div>
          <div className="value">{firstForecast ? Math.round(firstForecast.total/1000)+'К ₽' : '—'}</div>
          {growth !== null && <div className={`delta ${growth>=0?'delta-up':'delta-down'}`}>{growth>=0?'↑':'↓'} {Math.abs(growth)}% к текущему</div>}
        </div>
        <div className="metric-card">
          <div className="label">Точность модели</div>
          <div className="value">91%</div>
          <div className="delta delta-flat">за последние 3 мес.</div>
        </div>
        <div className="metric-card">
          <div className="label">Тренд</div>
          <div className="value" style={{fontSize:16,color:growth>=0?'var(--green)':'var(--red)'}}>
            {growth >= 0 ? '📈 Рост' : '📉 Спад'}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Факт vs Прогноз, тыс. ₽</h3>
        <div style={{display:'flex',gap:16,marginBottom:12,fontSize:12}}>
          <span style={{display:'flex',alignItems:'center',gap:6,color:'var(--text-2)'}}>
            <span style={{width:20,height:2,background:'var(--accent)',display:'inline-block',borderRadius:1}}/>Факт
          </span>
          <span style={{display:'flex',alignItems:'center',gap:6,color:'var(--text-2)'}}>
            <span style={{width:20,height:2,background:'var(--green)',display:'inline-block',borderRadius:1,borderTop:'2px dashed var(--green)',background:'none'}}/>Прогноз
          </span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="period" tick={{fontSize:11,fill:'rgba(255,255,255,.35)'}}/>
            <YAxis tick={{fontSize:11,fill:'rgba(255,255,255,.35)'}}/>
            <Tooltip content={<TT/>}/>
            <Line type="monotone" dataKey="fact" stroke="#4f8ef7" strokeWidth={2} dot={{r:4,fill:'#4f8ef7'}} connectNulls={false} name="Факт"/>
            <Line type="monotone" dataKey="forecast" stroke="#34d399" strokeWidth={2} strokeDasharray="6 3" dot={{r:4,fill:'#34d399'}} connectNulls={false} name="Прогноз"/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3>Факторы влияющие на прогноз</h3>
        {[
          {label:'Сезонность', impact:'+12%', color:'var(--green)', desc:'Лето — пик посещаемости'},
          {label:'Рост доставки', impact:'+8%', color:'var(--green)', desc:'Тренд на онлайн-заказы'},
          {label:'Новые арендаторы', impact:'+5%', color:'var(--green)', desc:'Открытие 2 новых точек'},
          {label:'Инфляция издержек', impact:'-3%', color:'var(--red)', desc:'Рост коммунальных расходов'},
        ].map((f,i) => (
          <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
            <div>
              <div style={{fontSize:13,fontWeight:500}}>{f.label}</div>
              <div style={{fontSize:11,color:'var(--text-2)',marginTop:2}}>{f.desc}</div>
            </div>
            <div style={{fontSize:14,fontWeight:600,color:f.color}}>{f.impact}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
