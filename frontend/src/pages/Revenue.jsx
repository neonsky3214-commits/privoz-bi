// Revenue.jsx
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { getRevenueMonthly, getRevenueSummary } from '../api.js'

const fmt = n => n ? (n >= 1e6 ? (n/1e6).toFixed(1)+'М ₽' : Math.round(n/1000)+'К ₽') : '—'

export default function Revenue() {
  const [monthly, setMonthly] = useState([])
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    getRevenueMonthly().then(rows => {
      const agg = {}
      rows.forEach(r => {
        if (!agg[r.period]) agg[r.period] = { period: r.period.slice(5), rent: 0, other: 0 }
        if (r.type === 'rent') agg[r.period].rent += r.total
        else agg[r.period].other += r.total
      })
      setMonthly(Object.values(agg).map(d => ({
        ...d, rent: Math.round(d.rent/1000), other: Math.round(d.other/1000)
      })))
    })
    getRevenueSummary('2025-05').then(setSummary)
  }, [])

  const pie = [
    { name: 'Аренда', value: 74, color: '#1e3a8a' },
    { name: 'Реклама', value: 14, color: '#0f766e' },
    { name: 'Мероприятия', value: 12, color: '#b45309' },
  ]

  return (
    <div>
      <div className="page-header"><h2>Выручка</h2><p>Динамика арендных и операционных платежей</p></div>
      <div className="metrics" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="metric-card"><div className="label">Аренда (май)</div><div className="value">{summary ? fmt(summary.total) : '...'}</div><div className="delta delta-up">↑ 7%</div></div>
        <div className="metric-card"><div className="label">% оплат вовремя</div><div className="value">{summary?.paid_pct}%</div><div className="delta delta-down">↓ 2%</div></div>
        <div className="metric-card"><div className="label">Дебиторка</div><div className="value">{summary ? fmt(summary.debt_total) : '...'}</div><div className="delta delta-down">{summary?.debt_tenants?.length} арендатора</div></div>
      </div>
      <div className="card"><h3>Ежемесячная выручка 2025, тыс. ₽</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="period" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="rent" stackId="a" fill="#1e3a8a" name="Аренда" radius={[0,0,0,0]} />
            <Bar dataKey="other" stackId="a" fill="#0f766e" name="Доп. услуги" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid-2">
        <div className="card"><h3>Структура доходов</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({name,value}) => `${name} ${value}%`} labelLine={false}>
                {pie.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card"><h3>Долги по арендаторам</h3>
          {summary?.debt_tenants?.map(t => (
            <div key={t.name} style={{ marginBottom: 10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12, marginBottom: 3 }}>
                <span>{t.name}</span><span style={{ color:'#b91c1c' }}>{fmt(t.debt)}</span>
              </div>
              <div style={{ background:'#f1f5f9', borderRadius: 3, height: 6 }}>
                <div style={{ width: Math.min(100, t.debt/2000)+'%', background:'#b91c1c', borderRadius: 3, height: '100%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
