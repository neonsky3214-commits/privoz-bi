import { useEffect, useState } from 'react'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { getTraffic, getDelivery, getMarketing, getAds, getComplaints, getNPS, getForecast, uploadExcel, uploadGSheets } from '../api.js'

// ─── Traffic ──────────────────────────────────────────────────────────────────
export default function Traffic() {
  const [data, setData] = useState(null)
  useEffect(() => { getTraffic().then(setData) }, [])
  const hourly = data?.hourly?.map(r => ({ hour: r.hour+':00', count: r.avg_count })) || []
  const daily  = data?.monthly?.slice(-14).map(r => ({ day: r.day.slice(8), total: r.total })) || []
  return (
    <div>
      <div className="page-header"><h2>Трафик и посещаемость</h2><p>Счётчики посетителей, часовая динамика</p></div>
      <div className="metrics">
        <div className="metric-card"><div className="label">Сегодня</div><div className="value">{data?.today?.toLocaleString('ru') || '...'}</div><div className="delta delta-up">↑ 6%</div></div>
        <div className="metric-card"><div className="label">Пиковый час</div><div className="value">18:00–20:00</div><div className="delta">~340/ч</div></div>
      </div>
      <div className="card"><h3>Часовой трафик (среднее)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={hourly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area type="monotone" dataKey="count" fill="#e8efff" stroke="#1e3a8a" strokeWidth={2} name="Посетители" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="card"><h3>Дневной трафик, последние 2 нед.</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="total" fill="#0f766e" radius={[3,3,0,0]} name="Посетители" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Delivery ─────────────────────────────────────────────────────────────────
const PLAT_LABELS = { yandex: 'Яндекс Еда', dc: 'Delivery Club', self: 'Самовывоз' }
const PLAT_COLORS = { yandex: '#1e3a8a', dc: '#b91c1c', self: '#0f766e' }

export function Delivery() {
  const [data, setData] = useState(null)
  useEffect(() => { getDelivery('2025-05').then(setData) }, [])
  const platforms = data?.by_platform || []
  const daily = {}
  ;(data?.daily || []).forEach(r => {
    const d = r.order_date.slice(8)
    if (!daily[d]) daily[d] = { day: d }
    daily[d][r.platform] = r.orders
  })
  const dailyArr = Object.values(daily).slice(-14)
  return (
    <div>
      <div className="page-header"><h2>Доставка</h2><p>Агрегаторы, рейтинги, динамика заказов</p></div>
      <div className="metrics" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {platforms.map(p => (
          <div key={p.platform} className="metric-card">
            <div className="label">{PLAT_LABELS[p.platform]}</div>
            <div className="value">{p.orders?.toLocaleString('ru')}</div>
            <div className="delta">заказов · ср. чек {Math.round(p.avg_check)} ₽</div>
          </div>
        ))}
      </div>
      <div className="card"><h3>Динамика заказов по агрегаторам (май)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={dailyArr}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            {['yandex','dc','self'].map(p => (
              <Line key={p} type="monotone" dataKey={p} stroke={PLAT_COLORS[p]} strokeWidth={2} dot={false} name={PLAT_LABELS[p]} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Marketing ────────────────────────────────────────────────────────────────
export function Marketing() {
  const [social, setSocial] = useState([])
  const [ads, setAds]       = useState([])
  const [tab, setTab]       = useState('social')
  useEffect(() => { getMarketing().then(setSocial); getAds().then(setAds) }, [])

  const platforms = ['instagram','vk','telegram']
  const COLORS = { instagram: '#b91c1c', vk: '#1e3a8a', telegram: '#0f766e' }
  const followersByPeriod = {}
  social.filter(r => r.metric === 'followers').forEach(r => {
    if (!followersByPeriod[r.period]) followersByPeriod[r.period] = { period: r.period.slice(5) }
    followersByPeriod[r.period][r.platform] = r.value
  })
  const follData = Object.values(followersByPeriod)
  const adsByPeriod = {}
  ads.forEach(r => {
    if (!adsByPeriod[r.period]) adsByPeriod[r.period] = { period: r.period.slice(5) }
    adsByPeriod[r.period][r.platform] = Math.round(r.spend)
  })
  const adsData = Object.values(adsByPeriod)

  return (
    <div>
      <div className="page-header"><h2>Маркетинг</h2><p>Соцсети, реклама, охваты</p></div>
      <div style={{ display:'flex', gap: 0, borderBottom:'1px solid #e2e8f0', marginBottom: 16 }}>
        {['social','ads'].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ padding:'7px 16px', cursor:'pointer', fontSize: 13, borderBottom: tab===t ? '2px solid #1e3a8a' : '2px solid transparent', marginBottom: -1, fontWeight: tab===t ? 600 : 400, color: tab===t ? '#1e3a8a' : '#64748b' }}>
            {t === 'social' ? 'Соцсети' : 'Реклама'}
          </div>
        ))}
      </div>
      {tab === 'social' && (
        <div className="card"><h3>Рост подписчиков 2025</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={follData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              {platforms.map(p => <Line key={p} type="monotone" dataKey={p} stroke={COLORS[p]} strokeWidth={2} dot={false} name={p} />)}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {tab === 'ads' && (
        <div className="card"><h3>Расход по рекламным каналам, ₽</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={adsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="yandex_direct" fill="#1e3a8a" name="Яндекс Директ" radius={[3,3,0,0]} />
              <Bar dataKey="vk_ads" fill="#b91c1c" name="ВК Таргет" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ─── Ops ──────────────────────────────────────────────────────────────────────
const CAT_RU = { cleanliness:'Чистота', queue:'Очереди', food:'Еда', service:'Сервис', tech:'Техника' }

export function Ops() {
  const [data, setData] = useState(null)
  const [nps, setNps]   = useState([])
  useEffect(() => { getComplaints('2025-05').then(setData); getNPS().then(setNps) }, [])
  const pieData = (data?.by_category || []).map(r => ({ name: CAT_RU[r.category]||r.category, value: r.count }))
  const COLORS = ['#b91c1c','#b45309','#1e3a8a','#0f766e','#64748b']
  const npsData = nps.map(r => ({ period: r.period.slice(5), score: r.score }))
  return (
    <div>
      <div className="page-header"><h2>Операционные показатели</h2><p>Жалобы, загрузка, NPS</p></div>
      <div className="metrics" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="metric-card"><div className="label">Жалоб (май)</div><div className="value">{data?.total || '...'}</div></div>
        <div className="metric-card"><div className="label">Загрузка мест</div><div className="value">74%</div><div className="delta delta-up">↑ 5%</div></div>
        <div className="metric-card"><div className="label">NPS (май)</div><div className="value">{nps.slice(-1)[0]?.score || '...'}</div></div>
      </div>
      <div className="grid-2">
        <div className="card"><h3>Жалобы по категориям</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({name,value})=>`${name}: ${value}`} labelLine={false}>
                {pieData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card"><h3>Свежие жалобы</h3>
          {(data?.recent || []).slice(0,5).map((c,i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #f1f5f9', fontSize: 12 }}>
              <span>{c.tenant} · {CAT_RU[c.category]||c.category}</span>
              <span style={{ color:'#64748b' }}>{c.created_at?.slice(0,10)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card"><h3>NPS по месяцам</h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={npsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="period" tick={{ fontSize: 11 }} />
            <YAxis domain={[50,90]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="#1e3a8a" strokeWidth={2} dot={{ r: 4 }} name="NPS" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Forecast ─────────────────────────────────────────────────────────────────
export function Forecast() {
  const [data, setData] = useState([])
  useEffect(() => { getForecast().then(setData) }, [])
  const chartData = data.map(r => ({
    period: r.period.slice(5),
    fact:     r.is_forecast ? null : Math.round(r.total/1000),
    forecast: r.is_forecast ? Math.round(r.total/1000) : null,
  }))
  return (
    <div>
      <div className="page-header">
        <h2>Прогноз <span style={{ fontSize:12, background:'#e8efff', color:'#1e3a8a', padding:'2px 8px', borderRadius:4, marginLeft:8 }}>AI-модель</span></h2>
        <p>Линейная экстраполяция на основе истории</p>
      </div>
      <div className="card"><h3>Факт vs Прогноз, тыс. ₽</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="period" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="fact" stroke="#1e3a8a" strokeWidth={2} dot={{ r: 4 }} connectNulls={false} name="Факт" />
            <Line type="monotone" dataKey="forecast" stroke="#0f766e" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 4 }} connectNulls={false} name="Прогноз" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Upload ───────────────────────────────────────────────────────────────────
export function Upload() {
  const [status, setStatus] = useState('')
  const [url, setUrl]       = useState('')

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setStatus('Загружаю...')
    try {
      const r = await uploadExcel(file)
      setStatus('✅ Импортировано: ' + r.imported.join(', '))
    } catch { setStatus('❌ Ошибка загрузки') }
  }

  async function handleUrl() {
    if (!url) return
    setStatus('Загружаю из Google Sheets...')
    try {
      const r = await uploadGSheets(url)
      setStatus('✅ ' + r.imported)
    } catch { setStatus('❌ Ошибка. Проверь ссылку') }
  }

  return (
    <div>
      <div className="page-header"><h2>Загрузить данные</h2><p>Excel или Google Sheets</p></div>
      <div className="card">
        <h3>Excel файл (.xlsx)</h3>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Листы: «revenue» или «traffic»</p>
        <label className="upload-area">
          <input type="file" accept=".xlsx,.xls" onChange={handleFile} />
          <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Перетащи файл или кликни для выбора</div>
        </label>
      </div>
      <div className="card">
        <h3>Google Sheets</h3>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Файл → Поделиться → Опубликовать в интернете → CSV</p>
        <div style={{ display:'flex', gap: 8 }}>
          <input type="text" placeholder="https://docs.google.com/spreadsheets/..." value={url} onChange={e => setUrl(e.target.value)}
            style={{ flex:1, padding:'8px 12px', border:'1px solid #e2e8f0', borderRadius: 6, fontSize: 12 }} />
          <button onClick={handleUrl} style={{ padding:'8px 16px', background:'#1e3a8a', color:'#fff', border:'none', borderRadius: 6, cursor:'pointer', fontSize: 12 }}>
            Импорт
          </button>
        </div>
      </div>
      {status && <div style={{ padding:'12px 16px', background: status.startsWith('✅') ? '#dcfce7' : '#fee2e2', borderRadius: 8, fontSize: 13 }}>{status}</div>}
    </div>
  )
}
