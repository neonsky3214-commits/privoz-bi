import { useState } from 'react'
import { uploadFile, uploadGSheets } from '../api.js'

const SECTIONS = [
  {id:'revenue',label:'Выручка / Аренда',icon:'💰',cols:'tenant, period, amount, type, paid',example:'Sushi Boom, 2025-05, 680000, rent, 1'},
  {id:'traffic',label:'Трафик',icon:'👥',cols:'ts, count',example:'2025-05-01 12:00, 145'},
  {id:'delivery',label:'Доставка',icon:'🛵',cols:'tenant, platform, order_date, amount, rating',example:'Sushi Boom, yandex, 2025-05-01, 640, 4.8'},
  {id:'marketing',label:'Маркетинг',icon:'📣',cols:'period, platform, metric, value',example:'2025-05, instagram, followers, 12400'},
  {id:'complaints',label:'Жалобы',icon:'⚠️',cols:'tenant, category, severity, created_at',example:'Wok Street, cleanliness, medium, 2025-05-10'},
  {id:'nps',label:'NPS',icon:'⭐',cols:'period, score, promoters, detractors, total',example:'2025-05, 71, 89, 14, 120'},
]

export default function Upload() {
  const [section, setSection] = useState(null)
  const [status, setStatus]   = useState('')
  const [url, setUrl]         = useState('')

  async function handleFile(e) {
    const file = e.target.files[0]; if (!file || !section) return
    setStatus('Загружаю...')
    try { const r = await uploadFile(file, section.id); setStatus('✅ ' + r.imported) }
    catch(e) { setStatus('❌ ' + (e.response?.data?.detail || e.message)) }
  }

  async function handleUrl() {
    if (!url || !section) return
    setStatus('Загружаю...')
    try { const r = await uploadGSheets(url, section.id); setStatus('✅ ' + r.imported) }
    catch(e) { setStatus('❌ ' + (e.response?.data?.detail || 'Ошибка')) }
  }

  return (
    <div>
      <div className="page-header"><h2>Загрузить данные</h2><p>Выбери раздел → загрузи файл</p></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
        {SECTIONS.map(s=>(
          <div key={s.id} onClick={()=>{setSection(s);setStatus('')}}
            style={{padding:'14px 16px',borderRadius:'var(--radius-lg)',cursor:'pointer',border:section?.id===s.id?'1px solid var(--accent)':'1px solid var(--border)',background:section?.id===s.id?'var(--accent-dim)':'var(--bg-card)',transition:'all .15s'}}>
            <div style={{fontSize:20,marginBottom:6}}>{s.icon}</div>
            <div style={{fontSize:13,fontWeight:500,color:section?.id===s.id?'#fff':'var(--text)'}}>{s.label}</div>
            <div style={{fontSize:11,color:'var(--text-2)',marginTop:3,fontFamily:'JetBrains Mono,monospace'}}>{s.cols}</div>
          </div>
        ))}
      </div>

      {section && <>
        <div className="card" style={{marginBottom:12}}>
          <h3>Пример строки для «{section.label}»</h3>
          <div style={{background:'var(--bg-3)',borderRadius:8,padding:'10px 14px',fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'var(--accent)',marginBottom:10}}>{section.example}</div>
          <div style={{fontSize:11,color:'var(--text-2)'}}>Колонки: <span style={{color:'var(--text)',fontFamily:'JetBrains Mono,monospace'}}>{section.cols}</span></div>
        </div>
        <div className="card">
          <h3>Загрузить файл</h3>
          <label className="upload-drop" style={{marginBottom:14}}>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile}/>
            <div style={{fontSize:28,marginBottom:8}}>📂</div>
            <div style={{fontSize:13,color:'var(--text-2)'}}>Перетащи или кликни · xlsx, xls, csv</div>
          </label>
          <div style={{fontSize:11,color:'var(--text-2)',marginBottom:8}}>Или Google Sheets (Файл → Опубликовать → CSV):</div>
          <div style={{display:'flex',gap:8}}>
            <input className="inp" placeholder="https://docs.google.com/spreadsheets/..." value={url} onChange={e=>setUrl(e.target.value)}/>
            <button className="btn btn-primary" onClick={handleUrl}>Импорт</button>
          </div>
        </div>
      </>}
      {status && <div style={{padding:'12px 16px',borderRadius:10,fontSize:13,background:status.startsWith('✅')?'var(--green-dim)':'var(--red-dim)',color:status.startsWith('✅')?'var(--green)':'var(--red)',border:`1px solid ${status.startsWith('✅')?'rgba(52,211,153,.2)':'rgba(248,113,113,.2)'}`}}>{status}</div>}
    </div>
  )
}
