import { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart, ReferenceLine } from 'recharts'
import axios from 'axios'

const api = axios.create({ baseURL: '/api' })
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('bi_token'); if (t) cfg.headers['X-Token'] = t; return cfg
})

const fmt = n => !n ? '—' : n >= 1e8 ? (n/1e6).toFixed(0)+'М ₽' : n >= 1e6 ? (n/1e6).toFixed(1)+'М ₽' : Math.round(n/1000)+'К ₽'
const fmtM = n => n ? Math.round(n/1e6).toLocaleString('ru')+'М' : '—'

const TT = ({ active, payload, label }) => active && payload?.length
  ? <div style={{background:'#1a1d26',border:'1px solid rgba(255,255,255,.1)',borderRadius:8,padding:'8px 12px',fontSize:12}}>
      <div style={{color:'rgba(255,255,255,.5)',marginBottom:4}}>{label}</div>
      {payload.filter(p=>p.value!=null).map((p,i)=>(
        <div key={i} style={{color:p.color||'#fff'}}>{p.name}: {typeof p.value==='number'?p.value.toLocaleString('ru'):p.value}</div>
      ))}
    </div> : null

const INCOME_CODES = ['1','1.1','1.1.1','1.1.1.1','1.1.1.2']
const EXPENSE_CODES = ['2','2.1.1','2.1.2','2.1.3','2.1.14']

const CODE_ICONS = {
  '1':'💰', '1.1':'🏪', '1.1.1':'📄', '1.1.1.1':'📌', '1.1.1.2':'📊',
  '2':'💸', '2.1.1':'👥', '2.1.2':'📣', '2.1.3':'🔧', '2.1.14':'🏛️'
}

export default function Finance() {
  const [year, setYear]           = useState('2026')
  const [years, setYears]         = useState([])
  const [summary, setSummary]     = useState(null)
  const [planFact, setPlanFact]   = useState([])
  const [breakdown, setBreakdown] = useState([])
  const [bMonth, setBMonth]       = useState('2026-03')
  const [tab, setTab]             = useState('cashflow')

  useEffect(() => {
    api.get('/bdds/years').then(r => { setYears(r.data); if(r.data.length) setYear(r.data[r.data.length-1]) }).catch(()=>{})
  }, [])

  useEffect(() => {
    api.get('/bdds/summary', {params:{year}}).then(r=>setSummary(r.data)).catch(()=>{})
    api.get('/bdds/plan-fact', {params:{date_from:`${year}-01`, date_to:`${year}-11`}}).then(r=>setPlanFact(r.data)).catch(()=>{})
  }, [year])

  useEffect(() => {
    api.get('/bdds/breakdown', {params:{period:bMonth}}).then(r=>setBreakdown(r.data)).catch(()=>{})
  }, [bMonth])

  // Build monthly cashflow chart
  const monthlyChart = (summary?.monthly || []).map(r => ({
    period: r.period.slice(5),
    income_plan:  r.income_plan  ? Math.round(r.income_plan/1e6)  : null,
    income_fact:  r.income_fact  ? Math.round(r.income_fact/1e6)  : null,
    expense_plan: r.expense_plan ? Math.round(r.expense_plan/1e6) : null,
    expense_fact: r.expense_fact ? Math.round(r.expense_fact/1e6) : null,
  }))

  // Net cashflow
  const netChart = monthlyChart.map(r => ({
    ...r,
    ndp_plan: r.income_plan && r.expense_plan ? r.income_plan - r.expense_plan : null,
    ndp_fact: r.income_fact && r.expense_fact ? r.income_fact - r.expense_fact : null,
  }))

  // Summary items
  const getItem = (code) => summary?.items?.find(i=>i.code===code)
  const income  = getItem('1')
  const expense = getItem('2')
  const ndp_plan = income && expense ? (income.plan_total||0) - (expense.plan_total||0) : null
  const ndp_fact = income && expense ? (income.fact_total||0) - (expense.fact_total||0) : null

  // Plan-fact table grouped by period
  const pfByPeriod = {}
  planFact.forEach(r => {
    if (!pfByPeriod[r.period]) pfByPeriod[r.period] = {}
    pfByPeriod[r.period][r.code] = r
  })

  // Breakdown income/expense
  const bdIncome  = breakdown.filter(r=>INCOME_CODES.includes(r.code))
  const bdExpense = breakdown.filter(r=>EXPENSE_CODES.includes(r.code))

  // Available months for breakdown
  const bMonths = [...new Set(planFact.map(r=>r.period))].sort()

  return (
    <div>
      <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div>
          <h2>БДДС — Финансы</h2>
          <p>Бюджет движения денежных средств · план vs факт</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          {years.map(y=>(
            <button key={y} onClick={()=>setYear(y)}
              style={{padding:'5px 14px',fontSize:12,borderRadius:8,border:'1px solid var(--border)',
                background:year===y?'var(--accent-dim)':'transparent',color:year===y?'var(--accent)':'var(--text-2)',
                cursor:'pointer',fontFamily:'Onest,sans-serif'}}>
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="metrics">
        <div className="metric-card">
          <div className="label">Поступления (план)</div>
          <div className="value">{fmt(income?.plan_total)}</div>
          <div className="delta delta-flat">за {year} (без итогового)</div>
        </div>
        <div className="metric-card">
          <div className="label">Поступления (факт)</div>
          <div className="value" style={{color:income?.fact_total ? 'var(--green)' : 'var(--text-2)'}}>
            {income?.fact_total ? fmt(income.fact_total) : 'нет данных'}
          </div>
          {income?.plan_total && income?.fact_total && (
            <div className={`delta ${income.fact_total>=income.plan_total?'delta-up':'delta-down'}`}>
              {Math.round(income.fact_total/income.plan_total*100)}% от плана
            </div>
          )}
        </div>
        <div className="metric-card">
          <div className="label">Расходы (план)</div>
          <div className="value">{fmt(expense?.plan_total)}</div>
        </div>
        <div className="metric-card">
          <div className="label">Расходы (факт)</div>
          <div className="value" style={{color:expense?.fact_total ? 'var(--amber)' : 'var(--text-2)'}}>
            {expense?.fact_total ? fmt(expense.fact_total) : 'нет данных'}
          </div>
          {expense?.plan_total && expense?.fact_total && (
            <div className={`delta ${expense.fact_total<=expense.plan_total?'delta-up':'delta-down'}`}>
              {Math.round(expense.fact_total/expense.plan_total*100)}% от плана
            </div>
          )}
        </div>
        <div className="metric-card">
          <div className="label">ЧДП (план)</div>
          <div className="value" style={{color:ndp_plan>0?'var(--green)':'var(--red)'}}>{fmt(ndp_plan)}</div>
        </div>
        <div className="metric-card">
          <div className="label">ЧДП (факт)</div>
          <div className="value" style={{color:ndp_fact>0?'var(--green)':ndp_fact<0?'var(--red)':'var(--text-2)'}}>
            {ndp_fact ? fmt(ndp_fact) : '—'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:0,borderBottom:'1px solid var(--border)',marginBottom:14}}>
        {[['cashflow','Денежный поток'],['planfact','План vs Факт'],['breakdown','Детализация']].map(([k,l])=>(
          <div key={k} onClick={()=>setTab(k)}
            style={{padding:'7px 16px',cursor:'pointer',fontSize:12,color:tab===k?'var(--accent)':'var(--text-2)',
              borderBottom:tab===k?'2px solid var(--accent)':'2px solid transparent',marginBottom:-1,transition:'all .15s'}}>
            {l}
          </div>
        ))}
      </div>

      {/* CASHFLOW TAB */}
      {tab==='cashflow' && <>
        <div className="card">
          <h3>Поступления и расходы по месяцам, млн ₽</h3>
          <div style={{display:'flex',gap:16,marginBottom:10,fontSize:11,flexWrap:'wrap'}}>
            {[['#4f8ef7','Поступления план'],['#34d399','Поступления факт'],['rgba(248,113,113,.5)','Расходы план'],['#f87171','Расходы факт']].map(([c,l])=>(
              <span key={l} style={{display:'flex',alignItems:'center',gap:5,color:'var(--text-2)'}}>
                <span style={{width:14,height:3,background:c,display:'inline-block',borderRadius:2}}/>
                {l}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyChart}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="period" tick={{fontSize:11,fill:'rgba(255,255,255,.35)'}}/>
              <YAxis tick={{fontSize:11,fill:'rgba(255,255,255,.35)'}}/>
              <Tooltip content={<TT/>}/>
              <Bar dataKey="income_plan"  fill="#4f8ef7" name="Поступления план" opacity={0.5} radius={[3,3,0,0]}/>
              <Bar dataKey="income_fact"  fill="#34d399" name="Поступления факт" radius={[3,3,0,0]}/>
              <Bar dataKey="expense_plan" fill="rgba(248,113,113,.4)" name="Расходы план" opacity={0.5} radius={[3,3,0,0]}/>
              <Bar dataKey="expense_fact" fill="#f87171" name="Расходы факт" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>ЧДП (чистый денежный поток), млн ₽</h3>
          <ResponsiveContainer width="100%" height={160}>
            <ComposedChart data={netChart}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="period" tick={{fontSize:11,fill:'rgba(255,255,255,.35)'}}/>
              <YAxis tick={{fontSize:11,fill:'rgba(255,255,255,.35)'}}/>
              <Tooltip content={<TT/>}/>
              <ReferenceLine y={0} stroke="rgba(255,255,255,.2)"/>
              <Bar dataKey="ndp_plan" fill="rgba(79,142,247,.4)" name="ЧДП план" radius={[3,3,0,0]}/>
              <Line type="monotone" dataKey="ndp_fact" stroke="#34d399" strokeWidth={2} dot={{r:4,fill:'#34d399'}} name="ЧДП факт" connectNulls/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </>}

      {/* PLAN-FACT TAB */}
      {tab==='planfact' && (
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <table className="bi-table">
            <thead>
              <tr>
                <th>Статья</th>
                {bMonths.map(p=><th key={p} colSpan={2} style={{textAlign:'center'}}>{p.slice(5)}</th>)}
              </tr>
              <tr>
                <th></th>
                {bMonths.map(p=>[
                  <th key={p+'p'} style={{fontSize:10,color:'rgba(79,142,247,.8)'}}>план</th>,
                  <th key={p+'f'} style={{fontSize:10,color:'rgba(52,211,153,.8)'}}>факт</th>
                ])}
              </tr>
            </thead>
            <tbody>
              {[...INCOME_CODES, ...EXPENSE_CODES].map(code => {
                const name = planFact.find(r=>r.code===code)?.name
                if (!name) return null
                return (
                  <tr key={code} style={{background:['1','2'].includes(code)?'rgba(255,255,255,.03)':''}}>
                    <td style={{fontWeight:['1','2'].includes(code)?600:400,paddingLeft:['1','2'].includes(code)?12:24}}>
                      {CODE_ICONS[code]} {name}
                    </td>
                    {bMonths.map(p => {
                      const d = pfByPeriod[p]?.[code]
                      const devPct = d?.plan && d?.fact ? Math.round((d.fact-d.plan)/d.plan*100) : null
                      return [
                        <td key={p+'p'} style={{color:'rgba(79,142,247,.7)',fontSize:12}}>{d?.plan ? fmtM(d.plan) : '—'}</td>,
                        <td key={p+'f'} style={{color:devPct==null?'var(--text-2)':devPct>=0?'var(--green)':'var(--red)',fontSize:12}}>
                          {d?.fact ? fmtM(d.fact) : d?.plan ? <span style={{color:'rgba(255,255,255,.2)'}}>—</span> : '—'}
                          {devPct!=null && <span style={{fontSize:10,marginLeft:4}}>{devPct>0?'+':''}{devPct}%</span>}
                        </td>
                      ]
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* BREAKDOWN TAB */}
      {tab==='breakdown' && <>
        <div className="filter-bar">
          <span>Месяц:</span>
          <select className="sel" value={bMonth} onChange={e=>setBMonth(e.target.value)}>
            {bMonths.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="grid-2">
          <div className="card">
            <h3>💰 Поступления</h3>
            {bdIncome.map(r=>(
              <div key={r.code} style={{padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:r.plan?4:0}}>
                  <span style={{fontWeight:['1','1.1'].includes(r.code)?600:400,paddingLeft:['1','1.1'].includes(r.code)?0:12,color:['1','1.1'].includes(r.code)?'#fff':'var(--text)'}}>
                    {CODE_ICONS[r.code]} {r.name}
                  </span>
                </div>
                {r.plan && (
                  <div style={{display:'flex',gap:12,fontSize:11,marginLeft:['1','1.1'].includes(r.code)?0:12}}>
                    <span style={{color:'rgba(79,142,247,.7)'}}>план: {fmt(r.plan)}</span>
                    {r.fact && <span style={{color:r.fact>=r.plan?'var(--green)':'var(--red)'}}>факт: {fmt(r.fact)}</span>}
                    {r.deviation_pct!=null && <span style={{color:r.deviation_pct>=0?'var(--green)':'var(--red)',fontWeight:500}}>{r.deviation_pct>0?'+':''}{r.deviation_pct}%</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="card">
            <h3>💸 Расходы</h3>
            {bdExpense.map(r=>(
              <div key={r.code} style={{padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:r.plan?4:0}}>
                  <span style={{fontWeight:['2'].includes(r.code)?600:400,paddingLeft:['2'].includes(r.code)?0:12,color:['2'].includes(r.code)?'#fff':'var(--text)'}}>
                    {CODE_ICONS[r.code]} {r.name}
                  </span>
                </div>
                {r.plan && (
                  <div style={{display:'flex',gap:12,fontSize:11,marginLeft:['2'].includes(r.code)?0:12}}>
                    <span style={{color:'rgba(79,142,247,.7)'}}>план: {fmt(r.plan)}</span>
                    {r.fact && <span style={{color:r.fact<=r.plan?'var(--green)':'var(--red)'}}>факт: {fmt(r.fact)}</span>}
                    {r.deviation_pct!=null && <span style={{color:r.deviation_pct<=0?'var(--green)':'var(--red)',fontWeight:500}}>{r.deviation_pct>0?'+':''}{r.deviation_pct}%</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </>}
    </div>
  )
}
