import { useEffect, useState } from 'react'
import { getEvents, saveEvent, deleteEvent } from '../api.js'

const TYPES = { concert:'🎤 Концерт', standup:'😂 Стендап', promo:'🎁 Акция', kids:'👶 Детское', sport:'⚽ Спорт', other:'📌 Другое' }

export default function Events() {
  const [events, setEvents] = useState([])
  const [form, setForm] = useState({ date:'', title:'', type:'concert', expected_traffic:'' })
  const [adding, setAdding] = useState(false)

  useEffect(() => { getEvents().then(setEvents).catch(()=>{}) }, [])

  async function handleAdd() {
    if (!form.date || !form.title) return
    const saved = await saveEvent(form).catch(()=>null)
    if (saved) { setEvents(ev => [...ev, saved]); setForm({ date:'', title:'', type:'concert', expected_traffic:'' }); setAdding(false) }
  }

  async function handleDelete(id) {
    await deleteEvent(id).catch(()=>{})
    setEvents(ev => ev.filter(e => e.id !== id))
  }

  const upcoming = events.filter(e => e.date >= new Date().toISOString().slice(0,10)).sort((a,b)=>a.date.localeCompare(b.date))
  const past     = events.filter(e => e.date < new Date().toISOString().slice(0,10)).sort((a,b)=>b.date.localeCompare(a.date))

  return (
    <div>
      <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div><h2>События и акции</h2><p>Влияние мероприятий на трафик и выручку</p></div>
        <button className="btn btn-primary" onClick={() => setAdding(true)}>+ Добавить</button>
      </div>

      {adding && (
        <div className="card">
          <h3>Новое событие</h3>
          <div className="grid-2" style={{marginBottom:12}}>
            <div>
              <div style={{fontSize:11,color:'var(--text-2)',marginBottom:5}}>Дата</div>
              <input type="date" className="inp" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
            </div>
            <div>
              <div style={{fontSize:11,color:'var(--text-2)',marginBottom:5}}>Тип</div>
              <select className="inp sel" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                {Object.entries(TYPES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,color:'var(--text-2)',marginBottom:5}}>Название</div>
            <input className="inp" placeholder="Например: Стендап Иванова" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:'var(--text-2)',marginBottom:5}}>Ожидаемый доп. трафик (чел.)</div>
            <input className="inp" type="number" placeholder="200" value={form.expected_traffic} onChange={e=>setForm({...form,expected_traffic:e.target.value})}/>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-primary" onClick={handleAdd}>Сохранить</button>
            <button className="btn btn-ghost" onClick={()=>setAdding(false)}>Отмена</button>
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="card">
          <h3>Предстоящие события</h3>
          {upcoming.map(e => (
            <div key={e.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
              <div style={{display:'flex',gap:12,alignItems:'center'}}>
                <div style={{width:40,textAlign:'center',fontSize:18}}>{TYPES[e.type]?.slice(0,2)}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:500}}>{e.title}</div>
                  <div style={{fontSize:11,color:'var(--text-2)',marginTop:2}}>{e.date} {e.expected_traffic ? `· +${e.expected_traffic} чел.` : ''}</div>
                </div>
              </div>
              <button onClick={()=>handleDelete(e.id)} style={{background:'none',border:'none',color:'var(--text-2)',cursor:'pointer',fontSize:16}}>×</button>
            </div>
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className="card">
          <h3>Прошедшие события</h3>
          {past.slice(0,5).map(e => (
            <div key={e.id} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)',opacity:.6}}>
              <div style={{display:'flex',gap:12}}>
                <span style={{fontSize:16}}>{TYPES[e.type]?.slice(0,2)}</span>
                <div>
                  <div style={{fontSize:13}}>{e.title}</div>
                  <div style={{fontSize:11,color:'var(--text-2)'}}>{e.date}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {events.length === 0 && !adding && (
        <div style={{textAlign:'center',padding:'60px 0',color:'var(--text-2)',fontSize:13}}>
          Нет событий. Добавь первое мероприятие, чтобы отслеживать его влияние на трафик.
        </div>
      )}
    </div>
  )
}
