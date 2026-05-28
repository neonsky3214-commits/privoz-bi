import { useEffect, useState } from 'react'
import { LineChart,Line,BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid } from 'recharts'
import { getMarketing, getAds } from '../api.js'

const TT = ({ active, payload, label }) => active && payload?.length
  ? <div style={{background:'#1a1d26',border:'1px solid rgba(255,255,255,.1)',borderRadius:8,padding:'8px 12px',fontSize:12}}>
      <div style={{color:'rgba(255,255,255,.5)',marginBottom:4}}>{label}</div>
      {payload.map((p,i)=><div key={i} style={{color:p.color}}>{p.name}: {p.value?.toLocaleString?.('ru')}</div>)}
    </div> : null

export default function Marketing() {
  const [social, setSocial] = useState([])
  const [ads, setAds]       = useState([])
  const [tab, setTab]       = useState('social')
  useEffect(() => { getMarketing().then(setSocial).catch(()=>{}); getAds().then(setAds).catch(()=>{}) }, [])

  const COLORS = {instagram:'#f87171',vk:'#4f8ef7',telegram:'#34d399'}
  const byPeriod = {}
  social.filter(r=>r.metric==='followers').forEach(r => {
    if (!byPeriod[r.period]) byPeriod[r.period] = {period:r.period.slice(5)}
    byPeriod[r.period][r.platform] = r.value
  })
  const follData = Object.values(byPeriod)
  const adsByPeriod = {}
  ads.forEach(r => {
    if (!adsByPeriod[r.period]) adsByPeriod[r.period] = {period:r.period.slice(5)}
    adsByPeriod[r.period][r.platform] = Math.round(r.spend)
  })
  const adsData = Object.values(adsByPeriod)

  const lastSocial = Object.values(byPeriod).slice(-1)[0] || {}
  return (
    <div>
      <div className="page-header"><h2>Маркетинг</h2><p>Соцсети, реклама, охваты</p></div>
      <div className="metrics" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
        <div className="metric-card"><div className="label">Instagram</div><div className="value">{lastSocial.instagram?.toLocaleString('ru')||'—'}</div><div className="delta delta-up">подписчиков</div></div>
        <div className="metric-card"><div className="label">ВКонтакте</div><div className="value">{lastSocial.vk?.toLocaleString('ru')||'—'}</div><div className="delta delta-up">подписчиков</div></div>
        <div className="metric-card"><div className="label">Telegram</div><div className="value">{lastSocial.telegram?.toLocaleString('ru')||'—'}</div><div className="delta delta-up">подписчиков</div></div>
      </div>
      <div style={{display:'flex',gap:0,borderBottom:'1px solid var(--border)',marginBottom:14}}>
        {[['social','Соцсети'],['ads','Реклама']].map(([k,l])=>(
          <div key={k} onClick={()=>setTab(k)} style={{padding:'7px 16px',cursor:'pointer',fontSize:12,color:tab===k?'var(--accent)':'var(--text-2)',borderBottom:tab===k?'2px solid var(--accent)':'2px solid transparent',marginBottom:-1,transition:'all .15s'}}>{l}</div>
        ))}
      </div>
      {tab==='social' && <div className="card"><h3>Рост подписчиков 2025</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={follData}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="period" tick={{fontSize:11,fill:'rgba(255,255,255,.35)'}}/>
            <YAxis tick={{fontSize:11,fill:'rgba(255,255,255,.35)'}}/>
            <Tooltip content={<TT/>}/>
            {['instagram','vk','telegram'].map(p=><Line key={p} type="monotone" dataKey={p} stroke={COLORS[p]} strokeWidth={2} dot={false} name={p}/>)}
          </LineChart>
        </ResponsiveContainer>
      </div>}
      {tab==='ads' && <div className="card"><h3>Расход по каналам, ₽</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={adsData}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="period" tick={{fontSize:11,fill:'rgba(255,255,255,.35)'}}/>
            <YAxis tick={{fontSize:11,fill:'rgba(255,255,255,.35)'}}/>
            <Tooltip content={<TT/>}/>
            <Bar dataKey="yandex_direct" fill="#4f8ef7" name="Яндекс Директ" radius={[3,3,0,0]}/>
            <Bar dataKey="vk_ads" fill="#f87171" name="ВК Таргет" radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>}
    </div>
  )
}
