import { createContext, useContext, useState } from 'react'

const PeriodCtx = createContext(null)

export function PeriodProvider({ children }) {
  const [period, setPeriod] = useState('2025-05')
  const [range, setRange]   = useState('month') // month | quarter | year

  const PERIODS = {
    month:   ['2025-05'],
    quarter: ['2025-03','2025-04','2025-05'],
    year:    ['2025-01','2025-02','2025-03','2025-04','2025-05'],
  }

  return (
    <PeriodCtx.Provider value={{ period, setPeriod, range, setRange, periods: PERIODS[range] }}>
      {children}
    </PeriodCtx.Provider>
  )
}

export const usePeriod = () => useContext(PeriodCtx)
