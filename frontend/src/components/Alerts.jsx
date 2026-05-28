import { useEffect, useState } from 'react'
import { getAlerts } from '../api.js'
import { usePeriod } from '../context.jsx'

export default function Alerts() {
  const { period } = usePeriod()
  const [alerts, setAlerts] = useState([])
  useEffect(() => { getAlerts(period).then(setAlerts).catch(() => {}) }, [period])
  if (!alerts.length) return null
  return (
    <div className="alert-bar">
      {alerts.map((a, i) => (
        <div key={i} className={`alert alert-${a.level}`}>
          <span className="alert-icon">{a.level === 'red' ? '🔴' : '🟡'}</span>
          <span>{a.message}</span>
        </div>
      ))}
    </div>
  )
}
