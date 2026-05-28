import { useState, useEffect } from 'react'
import { PeriodProvider, usePeriod } from './context.jsx'
import { login } from './api.js'
import Overview   from './pages/Overview.jsx'
import Revenue    from './pages/Revenue.jsx'
import Tenants    from './pages/Tenants.jsx'
import Traffic    from './pages/Traffic.jsx'
import Delivery   from './pages/Delivery.jsx'
import Marketing  from './pages/Marketing.jsx'
import Ops        from './pages/Ops.jsx'
import Forecast   from './pages/Forecast.jsx'
import Events     from './pages/Events.jsx'
import Settings   from './pages/Settings.jsx'
import Analytics  from './pages/Analytics.jsx'
import Upload     from './pages/Upload.jsx'

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
)

const NAV = [
  { section: 'Обзор' },
  { id:'overview',  label:'Главная',       icon:'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { section: 'Финансы' },
  { id:'revenue',   label:'Выручка',       icon:'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
  { id:'tenants',   label:'Арендаторы',    icon:'M3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM3 9l9-7 9 7' },
  { id:'analytics', label:'Реальные данные', icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id:'forecast',  label:'Прогноз',       icon:'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6' },
  { section: 'Операции' },
  { id:'traffic',   label:'Трафик',        icon:'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
  { id:'ops',       label:'Операционка',   icon:'M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z' },
  { id:'events',    label:'События',       icon:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
  { section: 'Каналы' },
  { id:'marketing', label:'Маркетинг',     icon:'M22 12h-4l-3 9L9 3l-3 9H2' },
  { id:'delivery',  label:'Доставка',      icon:'M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3M13 17H9m4 0a2 2 0 104 0 2 2 0 00-4 0zm0 0h6m0 0a2 2 0 104 0 2 2 0 00-4 0z' },
  { section: 'Система' },
  { id:'upload',    label:'Загрузить',     icon:'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12' },
  { id:'settings',  label:'Настройки',     icon:'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z' },
]

const PAGES = { overview:Overview, analytics:Analytics, revenue:Revenue, tenants:Tenants, traffic:Traffic, delivery:Delivery, marketing:Marketing, ops:Ops, forecast:Forecast, events:Events, settings:Settings, upload:Upload }

function Login({ onLogin }) {
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true); setErr('')
    try {
      const r = await login(pwd)
      localStorage.setItem('bi_token', r.token)
      onLogin()
    } catch { setErr('Неверный пароль') }
    setLoading(false)
  }

  return (
    <div className="login-wrap">
      <div className="login-box">
        <h1>ПРИВОЗ BI</h1>
        <p>Введите пароль для доступа к платформе</p>
        <input className="inp" type="password" placeholder="Пароль" value={pwd}
          onChange={e => setPwd(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ marginBottom: 12 }} />
        {err && <div style={{ color:'var(--red)', fontSize:12, marginBottom:10 }}>{err}</div>}
        <button className="btn btn-primary" style={{ width:'100%' }} onClick={handleLogin} disabled={loading}>
          {loading ? 'Проверяю...' : 'Войти'}
        </button>
      </div>
    </div>
  )
}

function Shell() {
  const [page, setPage] = useState('overview')
  const { range, setRange } = usePeriod()
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
        <div className="period-bar">
          <div className="period-bar-label">Период</div>
          <div className="period-btns">
            {[['month','Мес'],['quarter','Кв'],['year','Год']].map(([k,l]) => (
              <button key={k} className={`period-btn${range===k?' active':''}`} onClick={() => setRange(k)}>{l}</button>
            ))}
          </div>
        </div>
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
