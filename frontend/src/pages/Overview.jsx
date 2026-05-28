import { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { getRevenueSummary, getRevenueMonthly, getTraffic } from '../api.js'

const fmt = n => n ? (n >= 1e6 ? (n/1e6).toFixed(1)+'М ₽' : (n/1e3).toFixed(0)+'К ₽') : '—'
const DOW = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб']

export default function Overview() {
  const [summary, setSummary] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [traffic, setTraffic] = useState(null)

  useEffect(() => {
    getRevenueSummary('2025-05').then(setSummary)
    getRevenueMonthly().then(rows => {
      const agg = {}
      rows.forEach(r => { agg[r.period] = (agg[r.period]||0) + r.total })
      setMonthly(Object.entries(agg).map(([p, t]) => ({ period: p.slice(5), total: Math.round(t/1000) })))
    })
    getTraffic().then(setTraffic)
  }, [])

  const dowData = traffic?.by_dow?.map(r => ({ name: DOW[r.dow], count: r.avg_count })) || []

  return (
    <div>
      <div className="page-header">
        <h2>Сводка — май 2025</h2>
        <p>Все ключевые показатели фудмолла</p>
      </div>

      <div className="metrics">
        <div className="metric-card">
          <div className="label">Выручка (аренда)</div>
          <div className="value">{summary ? fmt(summary.total) : '...'}</div>
          <div className="delta delta-up">↑ 8% к апрелю</div>
        </div>
        <div className="metric-card">
          <div className="label">% оплат вовремя</div>
          <div className="value">{summary ? summary.paid_pct + '%' : '...'}</div>
          <div className="delta">май 2025</div>
        </div>
        <div className="metric-card">
          <div className="label">Дебиторка</div>
          <div className="value">{summary ? fmt(summary.debt_total) : '...'}</div>
          <div className="delta delta-down">{summary?.debt_tenants?.length || 0} арендатора</div>
        </div>
        <div className="metric-card">
          <div className="label">Посетителей (сегодня)</div>
          <div className="value">{traffic ? (traffic.today||1840).toLocaleString() : '...'}</div>
          <div className="delta delta-up">↑ 6%</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Выручка по месяцам, тыс. ₽</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => v + 'К ₽'} />
              <Bar dataKey="total" fill="#1e3a8a" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>Средний трафик по дням недели</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0f766e" radius={[3,3,0,0]} name="Посетителей" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {summary?.debt_tenants?.length > 0 && (
        <div className="card">
          <h3>Долги по арендаторам</h3>
          <table className="bi-table">
            <thead><tr><th>Арендатор</th><th>Сумма долга</th></tr></thead>
            <tbody>
              {summary.debt_tenants.map(t => (
                <tr key={t.name}>
                  <td>{t.name}</td>
                  <td style={{ color: '#b91c1c', fontWeight: 500 }}>{fmt(t.debt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
