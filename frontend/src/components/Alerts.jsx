import { useEffect, useState } from 'react'
import api from '../api.js'
import { usePeriod } from '../context.jsx'

export default function Alerts() {
  const { dateTo } = usePeriod()
  const [alerts, setAlerts] = useState([])
  useEffect(() => {
    api.get('/alerts/', { params: { period: dateTo } }).then(r => setAlerts(r.data)).catch(() => {})
  }, [dateTo])
  if (!alerts.length) return null
  return (
    <div className="alert-bar">
      {alerts.map((a, i) => (
        <div key={i} className={`alert alert-${a.level}`}>
          <span style={{flexShrink:0}}>{a.level === 'red' ? '🔴' : '🟡'}</span>
          <span>{a.message}</span>
        </div>
      ))}
    </div>
  )
}
