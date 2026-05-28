import { useState } from 'react'
import Overview   from './pages/Overview.jsx'
import Revenue    from './pages/Revenue.jsx'
import Tenants    from './pages/Tenants.jsx'
import Traffic    from './pages/Traffic.jsx'
import Delivery   from './pages/Delivery.jsx'
import Marketing  from './pages/Marketing.jsx'
import Ops        from './pages/Ops.jsx'
import Forecast   from './pages/Forecast.jsx'
import Upload     from './pages/Upload.jsx'

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const NAV = [
  { section: 'Обзор' },
  { id: 'overview',  label: 'Главная',      icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { section: 'Финансы' },
  { id: 'revenue',   label: 'Выручка',      icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
  { id: 'tenants',   label: 'Арендаторы',   icon: 'M3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM3 9l9-7 9 7' },
  { section: 'Операции' },
  { id: 'traffic',   label: 'Трафик',       icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
  { id: 'ops',       label: 'Операционка',  icon: 'M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z' },
  { section: 'Каналы' },
  { id: 'marketing', label: 'Маркетинг',    icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
  { id: 'delivery',  label: 'Доставка',     icon: 'M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3M13 17H9m4 0a2 2 0 104 0 2 2 0 00-4 0zm0 0h6m0 0a2 2 0 104 0 2 2 0 00-4 0z' },
  { section: 'Аналитика' },
  { id: 'forecast',  label: 'Прогноз',      icon: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6' },
  { id: 'upload',    label: 'Загрузить',    icon: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12' },
]

const PAGES = { overview: Overview, revenue: Revenue, tenants: Tenants, traffic: Traffic, delivery: Delivery, marketing: Marketing, ops: Ops, forecast: Forecast, upload: Upload }

export default function App() {
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
              : <div key={item.id} className={`nav-item${page === item.id ? ' active' : ''}`} onClick={() => setPage(item.id)}>
                  <Icon d={item.icon} />
                  {item.label}
                </div>
          )}
        </nav>
      </aside>
      <main className="main">
        <Page />
      </main>
    </div>
  )
}
