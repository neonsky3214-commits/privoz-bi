import { useEffect, useState } from 'react'
import { BarChart,Bar,LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid,PieChart,Pie,Cell } from 'recharts'
import { getComplaints, getNPS } from '../api.js'
import { usePeriod } from '../context.jsx'

const CAT = {cleanliness:'Чистота',queue:'Очереди',food:'Еда',service:'Сервис',tech:'Техника'}
const TT = ({ active, payload, label }) => active && payload?.length
  ? <div style={{background:'#1a1d26',border:'1px solid rgba(255,255,255,.1)',borderRadius:8,padding:'8px 12px',fontSize:12}}>
      <div style={{color:'rgba(255,255,255,.5)',marginBottom:4}}>{label}</div>
      {payload.map((p,i)=><div key={i} style={{color:p.color}}>{p.name}: {p.value}</div>)}
    </div> : null

export default function Ops() {
  const { period } = usePeriod()
  const [complaints, setComplaints] = useState(null)
  const [nps, setNps] = useState([])
  useEffect(() => {
    getComplaints(period).then(setComplaints).catch(()=>{})
    getNPS().then(setNps).catch(()=>{})
  }, [period])

  const pieData = (complaints?.by_category||[]).map(r=>({name:CAT[r.category]||r.category,value:r.count}))
  const COLORS = ['#f87171','#fbbf24','#4f8ef7','#34d399','#a78bfa']
  const npsData = nps.map(r=>({period:r.period.slice(5),score:r.score}))
  const lastNps = nps.slice(-1)[0]?.score || 0

  return (
    <div>
      <div className="page-header"><h2>Операционные показатели</h2><p>Жалобы, загрузка, NPS · {period}</p></div>
      <div className="metrics" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
        <div className="metric-card"><div className="label">Жалоб (период)</div><div className="value">{complaints?.total||'—'}</div><div className={`delta ${(complaints?.total||0)>25?'delta-down':'delta-up'}`}>{(complaints?.total||0)>25?'↑ выше нормы':'в норме'}</div></div>
        <div className="metric-card"><div className="label">Загрузка мест</div><div className="value">74%</div><div className="delta delta-up">↑ 5%</div></div>
        <div className="metric-card"><div className="label">NPS</div><div className="value">{lastNps}</div><div className={`delta ${lastNps>=70?'delta-up':lastNps>=60?'delta-flat':'delta-down'}`}>{lastNps>=70?'Отлично':lastNps>=60?'Норма':'Нужны действия'}</div></div>
      </div>
      <div className="grid-2">
        <div className="card"><h3>Жалобы по категориям</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart><Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={65} label={({name,value})=>`${name}: ${value}`} labelLine={false}>
              {pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
            </Pie><Tooltip/></PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card"><h3>Свежие жалобы</h3>
          {(complaints?.recent||[]).slice(0,5).map((c,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)',fontSize:12}}>
              <span>{c.tenant} · {CAT[c.category]||c.category}</span>
              <span style={{color:'var(--text-2)'}}>{c.created_at?.slice(0,10)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card"><h3>NPS по месяцам</h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={npsData}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="period" tick={{fontSize:11,fill:'rgba(255,255,255,.35)'}}/>
            <YAxis domain={[50,90]} tick={{fontSize:11,fill:'rgba(255,255,255,.35)'}}/>
            <Tooltip content={<TT/>}/>
            <Line type="monotone" dataKey="score" stroke="#4f8ef7" strokeWidth={2} dot={{r:4,fill:'#4f8ef7'}} name="NPS"/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
