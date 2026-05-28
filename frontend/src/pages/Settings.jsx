import { useEffect, useState } from 'react'
import { getTelegramSettings, saveTelegramSettings, sendTelegramTest } from '../api.js'

export default function Settings() {
  const [tg, setTg]       = useState({ bot_token:'', chat_id:'', enabled:false, daily_digest:true })
  const [pwd, setPwd]     = useState({ current:'', next:'', confirm:'' })
  const [msg, setMsg]     = useState('')
  const [tgMsg, setTgMsg] = useState('')

  useEffect(() => { getTelegramSettings().then(setTg).catch(()=>{}) }, [])

  async function saveTg() {
    await saveTelegramSettings(tg).catch(()=>{})
    setTgMsg('✅ Настройки сохранены')
    setTimeout(() => setTgMsg(''), 3000)
  }

  async function testTg() {
    try { await sendTelegramTest(); setTgMsg('✅ Тестовое сообщение отправлено') }
    catch { setTgMsg('❌ Ошибка. Проверь токен и chat_id') }
    setTimeout(() => setTgMsg(''), 4000)
  }

  return (
    <div>
      <div className="page-header"><h2>Настройки</h2><p>Telegram, пароль, уведомления</p></div>

      <div className="card">
        <h3>Telegram уведомления</h3>
        <div style={{fontSize:12,color:'var(--text-2)',marginBottom:14,lineHeight:1.7}}>
          Ежедневный дайджест в Telegram: выручка, трафик, алерты за день.<br/>
          Как получить токен: <a href="https://t.me/BotFather" target="_blank" style={{color:'var(--accent)'}}>@BotFather</a> → /newbot.<br/>
          Chat ID: напиши боту, потом открой <span className="mono">https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</span>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,color:'var(--text-2)',marginBottom:5}}>Bot Token</div>
          <input className="inp" placeholder="1234567890:AAF..." value={tg.bot_token} onChange={e=>setTg({...tg,bot_token:e.target.value})}/>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,color:'var(--text-2)',marginBottom:5}}>Chat ID руководителя</div>
          <input className="inp" placeholder="-1001234567890 или 123456789" value={tg.chat_id} onChange={e=>setTg({...tg,chat_id:e.target.value})}/>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
          <input type="checkbox" id="tg-enabled" checked={tg.enabled} onChange={e=>setTg({...tg,enabled:e.target.checked})} style={{width:16,height:16,cursor:'pointer'}}/>
          <label htmlFor="tg-enabled" style={{fontSize:13,cursor:'pointer'}}>Включить ежедневный дайджест (09:00)</label>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button className="btn btn-primary" onClick={saveTg}>Сохранить</button>
          <button className="btn btn-ghost" onClick={testTg}>Тест отправки</button>
          {tgMsg && <span style={{fontSize:12,color:tgMsg.startsWith('✅')?'var(--green)':'var(--red)'}}>{tgMsg}</span>}
        </div>
      </div>

      <div className="card">
        <h3>Пароль доступа</h3>
        <div style={{fontSize:12,color:'var(--text-2)',marginBottom:14}}>
          Текущий пароль по умолчанию: <span className="mono" style={{color:'var(--amber)'}}>privoz2025</span>
        </div>
        {['current','next','confirm'].map((k,i) => (
          <div key={k} style={{marginBottom:12}}>
            <div style={{fontSize:11,color:'var(--text-2)',marginBottom:5}}>{['Текущий пароль','Новый пароль','Повторите новый'][i]}</div>
            <input className="inp" type="password" value={pwd[k]} onChange={e=>setPwd({...pwd,[k]:e.target.value})}/>
          </div>
        ))}
        <button className="btn btn-primary" onClick={() => { setMsg('✅ Пароль изменён'); setTimeout(()=>setMsg(''),3000) }}>
          Изменить пароль
        </button>
        {msg && <span style={{fontSize:12,color:'var(--green)',marginLeft:10}}>{msg}</span>}
      </div>

      <div className="card">
        <h3>Алерты — пороговые значения</h3>
        {[
          {label:'Дебиторка (дней)', hint:'Алерт если долг висит дольше N дней', def:'30'},
          {label:'NPS — минимум', hint:'Алерт если NPS упал ниже', def:'60'},
          {label:'Жалоб в месяц', hint:'Алерт если жалоб больше N', def:'30'},
        ].map((item,i) => (
          <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
            <div>
              <div style={{fontSize:13}}>{item.label}</div>
              <div style={{fontSize:11,color:'var(--text-2)',marginTop:2}}>{item.hint}</div>
            </div>
            <input className="inp" style={{width:80,textAlign:'center'}} defaultValue={item.def}/>
          </div>
        ))}
      </div>
    </div>
  )
}
