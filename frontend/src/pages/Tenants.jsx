import { useEffect, useState } from 'react'
import { getTenants } from '../api.js'

const fmt = n => n ? Math.round(n).toLocaleString('ru') + ' ₽' : '—'

function statusBadge(debt, status) {
  if (status !== 'active') return <span className="badge badge-red">Неактивен</span>
  if (debt > 50000)        return <span className="badge badge-amber">Долг</span>
  return                          <span className="badge badge-green">OK</span>
}

export default function Tenants() {
  const [tenants, setTenants] = useState([])
  const [period, setPeriod]   = useState('2025-05')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getTenants(period).then(d => { setTenants(d); setLoading(false) })
  }, [period])

  return (
    <div>
      <div className="page-header">
        <h2>Арендаторы</h2>
        <p>Показатели каждой точки фудмолла</p>
      </div>

      <div className="filter-bar">
        Период:
        <select className="period-select" value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="2025-05">Май 2025</option>
          <option value="2025-04">Апрель 2025</option>
          <option value="2025-03">Март 2025</option>
        </select>
      </div>

      {loading ? <div className="loading">Загрузка...</div> : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="bi-table">
            <thead>
              <tr>
                <th>Арендатор</th>
                <th>Категория</th>
                <th>Выручка</th>
                <th>Долг</th>
                <th>Площадь, м²</th>
                <th>Ставка ₽/м²</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 500 }}>{t.name}</td>
                  <td style={{ color: '#64748b' }}>{t.category}</td>
                  <td>{fmt(t.revenue)}</td>
                  <td style={{ color: t.debt > 0 ? '#b91c1c' : '#64748b' }}>
                    {t.debt > 0 ? fmt(t.debt) : '—'}
                  </td>
                  <td>{t.area_sqm}</td>
                  <td>{t.rent_rate?.toLocaleString('ru')}</td>
                  <td>{statusBadge(t.debt, t.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
