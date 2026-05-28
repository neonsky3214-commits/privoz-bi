import { useEffect, useState } from 'react'
import { getTenants, getPlans, savePlan } from '../api.js'
import { usePeriod } from '../context.jsx'

const fmt = n => n ? Math.round(n).toLocaleString('ru') + ' ₽' : '—'

export default function Tenants() {
  const { period } = usePeriod()
  const [tenants, setTenants] = useState([])
  const [plans, setPlans]     = useState({})
  const [editPlan, setEditPlan] = useState(null)
  const [planVal, setPlanVal]   = useState('')
  const [tab, setTab] = useState('table')

  useEffect(() => {
    getTenants(period).then(setTenants).catch(()=>{})
    getPlans(period).then(list => {
      const m = {}; list.forEach(p => { m[p.tenant_id] = p.plan_amount }); setPlans(m)
    }).catch(()=>{})
  }, [period])

  const sorted = [...tenants].sort((a,b) => b.revenue - a.revenue)
  const top3   = sorted.slice(0,3)
  const bot3   = sorted.slice(-3).reverse()

  async function savePlanVal(tid) {
    await savePlan({ tenant_id: tid, period, plan_amount: parseFloat(planVal) }).catch(()=>{})
    setPlans(p => ({...p, [tid]: parseFloat(planVal)}))
    setEditPlan(null)
  }

  function badge(debt, status) {
    if (status !== 'active') return <span className="badge badge-red">Неактивен</span>
    if (debt > 50000)        return <span className="badge badge-amber">Долг</span>
    return                          <span className="badge badge-green">OK</span>
  }

  function planPct(tid, revenue) {
    const plan = plans[tid]
    if (!plan) return null
    return Math.round(revenue / plan * 100)
  }

  return (
    <div>
      <div className="page-header"><h2>Арендаторы</h2><p>Показатели каждой точки · {period}</p></div>

      <div style={{display:'flex',gap:0,borderBottom:'1px solid var(--border)',marginBottom:16}}>
        {[['table','Таблица'],['rating','Рейтинг'],['plan','Plan vs Fact']].map(([k,l]) => (
          <div key={k} onClick={() => setTab(k)}
            style={{padding:'7px 16px',cursor:'pointer',fontSize:12,color:tab===k?'var(--accent)':'var(--text-2)',borderBottom:tab===k?'2px solid var(--accent)':'2px solid transparent',marginBottom:-1,transition:'all .15s'}}>
            {l}
          </div>
        ))}
      </div>

      {tab === 'table' && (
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <table className="bi-table">
            <thead><tr><th>Арендатор</th><th>Категория</th><th>Выручка</th><th>Долг</th><th>Ср. чек</th><th>Статус</th></tr></thead>
            <tbody>
              {sorted.map(t => (
                <tr key={t.id}>
                  <td style={{fontWeight:500}}>{t.name}</td>
                  <td style={{color:'var(--text-2)'}}>{t.category}</td>
                  <td style={{color:'var(--accent)',fontWeight:500}}>{fmt(t.revenue)}</td>
                  <td style={{color:t.debt>0?'var(--red)':'var(--text-2)'}}>{t.debt>0?fmt(t.debt):'—'}</td>
                  <td>{t.avg_check ? Math.round(t.avg_check)+' ₽' : '—'}</td>
                  <td>{badge(t.debt, t.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'rating' && (
        <div className="grid-2">
          <div className="card">
            <h3>🏆 Топ-3 по выручке</h3>
            {top3.map((t,i) => (
              <div key={t.id} style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                <div style={{width:28,height:28,borderRadius:'50%',background:'var(--accent-dim)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'var(--accent)',fontWeight:600,flexShrink:0}}>{i+1}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500}}>{t.name}</div>
                  <div className="plan-bar" style={{marginTop:4}}>
                    <div className="plan-fill" style={{width:Math.round(t.revenue/top3[0].revenue*100)+'%',background:'var(--accent)'}}/>
                  </div>
                </div>
                <div style={{fontSize:13,color:'var(--accent)',fontWeight:500,flexShrink:0}}>{Math.round(t.revenue/1000)}К</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3>⚠️ Антитоп — нужна помощь</h3>
            {bot3.map((t,i) => (
              <div key={t.id} style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                <div style={{width:28,height:28,borderRadius:'50%',background:'var(--red-dim)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'var(--red)',fontWeight:600,flexShrink:0}}>↓</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500}}>{t.name}</div>
                  <div className="plan-bar" style={{marginTop:4}}>
                    <div className="plan-fill" style={{width:Math.round(t.revenue/top3[0].revenue*100)+'%',background:'var(--red)'}}/>
                  </div>
                </div>
                <div style={{fontSize:13,color:'var(--red)',fontWeight:500,flexShrink:0}}>{Math.round(t.revenue/1000)}К</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'plan' && (
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <table className="bi-table">
            <thead><tr><th>Арендатор</th><th>Факт</th><th>План</th><th>% выполнения</th><th></th></tr></thead>
            <tbody>
              {sorted.map(t => {
                const pct = planPct(t.id, t.revenue)
                return (
                  <tr key={t.id}>
                    <td style={{fontWeight:500}}>{t.name}</td>
                    <td style={{color:'var(--accent)'}}>{fmt(t.revenue)}</td>
                    <td>
                      {editPlan === t.id
                        ? <div style={{display:'flex',gap:6}}>
                            <input className="inp" value={planVal} onChange={e=>setPlanVal(e.target.value)} style={{width:110,padding:'4px 8px',fontSize:12}} autoFocus onKeyDown={e=>e.key==='Enter'&&savePlanVal(t.id)}/>
                            <button className="btn btn-primary" style={{padding:'4px 10px',fontSize:12}} onClick={()=>savePlanVal(t.id)}>✓</button>
                          </div>
                        : <span style={{cursor:'pointer',color:'var(--text-2)'}} onClick={()=>{setEditPlan(t.id);setPlanVal(plans[t.id]||'')}}>
                            {plans[t.id] ? fmt(plans[t.id]) : <span style={{color:'var(--border-2)'}}>+ задать план</span>}
                          </span>
                      }
                    </td>
                    <td>
                      {pct !== null
                        ? <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <div className="plan-bar" style={{width:80}}>
                              <div className="plan-fill" style={{width:Math.min(100,pct)+'%',background:pct>=100?'var(--green)':pct>=70?'var(--amber)':'var(--red)'}}/>
                            </div>
                            <span style={{fontSize:12,color:pct>=100?'var(--green)':pct>=70?'var(--amber)':'var(--red)',fontWeight:500}}>{pct}%</span>
                          </div>
                        : <span style={{color:'var(--border-2)',fontSize:12}}>—</span>
                      }
                    </td>
                    <td/>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
