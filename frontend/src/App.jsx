import { useState, useEffect } from 'react'
import { PeriodProvider, usePeriod } from './context.jsx'
import axios from 'axios'
import Overview   from './pages/Overview.jsx'
import Revenue    from './pages/Revenue.jsx'
import Tenants    from './pages/Tenants.jsx'
import Traffic    from './pages/Traffic.jsx'
import Delivery   from './pages/Delivery.jsx'
import Marketing  from './pages/Marketing.jsx'
import Ops        from './pages/Ops.jsx'
import Forecast   from './pages/Forecast.jsx'
import Analytics  from './pages/Analytics.jsx'
import Events     from './pages/Events.jsx'
import Settings   from './pages/Settings.jsx'
import Upload     from './pages/Upload.jsx'

const api = axios.create({ baseURL: '/api' })

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
)

const NAV = [
  { section: 'Обзор' },
  { id:'overview',  label:'Главная',         icon:'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { id:'analytics', label:'Реальные данные', icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { section: 'Финансы' },
  { id:'revenue',   label:'Выручка',         icon:'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
  { id:'tenants',   label:'Арендаторы',      icon:'M3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM3 9l9-7 9 7' },
  { id:'forecast',  label:'Прогноз',         icon:'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6' },
  { section: 'Операции' },
  { id:'traffic',   label:'Трафик',          icon:'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
  { id:'ops',       label:'Операционка',     icon:'M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z' },
  { id:'events',    label:'События',         icon:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
  { section: 'Каналы' },
  { id:'marketing', label:'Маркетинг',       icon:'M22 12h-4l-3 9L9 3l-3 9H2' },
  { id:'delivery',  label:'Доставка',        icon:'M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3M13 17H9m4 0a2 2 0 104 0 2 2 0 00-4 0zm0 0h6m0 0a2 2 0 104 0 2 2 0 00-4 0z' },
  { section: 'Система' },
  { id:'upload',    label:'Загрузить',       icon:'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12' },
  { id:'settings',  label:'Настройки',       icon:'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
]

const PAGES = { overview:Overview, analytics:Analytics, revenue:Revenue, tenants:Tenants, traffic:Traffic, delivery:Delivery, marketing:Marketing, ops:Ops, forecast:Forecast, events:Events, settings:Settings, upload:Upload }

function Login({ onLogin }) {
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true); setErr('')
    try {
      const r = await api.post('/auth/login', { password: pwd })
      localStorage.setItem('bi_token', r.data.token)
      onLogin()
    } catch { setErr('Неверный пароль') }
    setLoading(false)
  }

  return (
    <div className="login-wrap">
      <div className="login-box">
        <div style={{fontSize:32,marginBottom:12}}>🏪</div>
        <h1>ПРИВОЗ BI</h1>
        <p>Аналитическая платформа фудмолла</p>
        <input className="inp" type="password" placeholder="Пароль" value={pwd}
          onChange={e=>setPwd(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&handleLogin()}
          style={{marginBottom:12,textAlign:'left'}}/>
        {err && <div style={{color:'var(--red)',fontSize:12,marginBottom:10}}>{err}</div>}
        <button className="btn btn-primary" style={{width:'100%'}} onClick={handleLogin} disabled={loading}>
          {loading ? 'Проверяю...' : 'Войти'}
        </button>
      </div>
    </div>
  )
}

function PeriodBar() {
  const { dateFrom, setDateFrom, dateTo, setDateTo } = usePeriod()
  const [periods, setPeriods] = useState([])

  useEffect(() => {
    const token = localStorage.getItem('bi_token')
    if (!token) return
    api.get('/tenants/periods', {headers:{'X-Token':token}})
      .then(r => setPeriods(r.data))
      .catch(()=>{})
  }, [])

  const presets = [
    {label:'2022', from:'2022-01', to:'2022-12'},
    {label:'2023', from:'2023-01', to:'2023-12'},
    {label:'2024', from:'2024-01', to:'2024-12'},
    {label:'2025', from:'2025-01', to:'2025-12'},
    {label:'6М',   from:'2025-07', to:'2025-12'},
    {label:'3М',   from:'2025-10', to:'2025-12'},
  ]

  return (
    <div className="period-bar">
      <div className="period-bar-label">Период данных</div>
      <div style={{display:'flex',gap:4,marginBottom:6}}>
        <select className="sel" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{flex:1,fontSize:11}}>
          {periods.map(p=><option key={p} value={p}>{p}</option>)}
        </select>
        <span style={{color:'var(--text-2)',fontSize:11,alignSelf:'center'}}>—</span>
        <select className="sel" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{flex:1,fontSize:11}}>
          {periods.map(p=><option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
        {presets.map(p=>(
          <button key={p.label} onClick={()=>{setDateFrom(p.from);setDateTo(p.to)}}
            className="period-btn"
            style={{flex:'none',padding:'3px 7px',fontSize:10,
              ...(dateFrom===p.from&&dateTo===p.to?{background:'var(--accent-dim)',borderColor:'var(--accent)',color:'var(--accent)'}:{})}}>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Shell() {
  const [page, setPage] = useState('overview')
  const Page = PAGES[page] || Overview

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>ПРИВОЗ</h1>
          <p>BI Платформа</p>
        </div>
        <nav className="nav">
          {NAV.map((item, i) =>
            item.section
              ? <div key={i} className="nav-section">{item.section}</div>
              : <div key={item.id} className={`nav-item${page===item.id?' active':''}`} onClick={() => setPage(item.id)}>
                  <Icon d={item.icon}/>{item.label}
                </div>
          )}
        </nav>
        <PeriodBar />
      </aside>
      <main className="main"><Page /></main>
    </div>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('bi_token'))
  if (!authed) return <Login onLogin={() => setAuthed(true)} />
  return <PeriodProvider><Shell /></PeriodProvider>
}
