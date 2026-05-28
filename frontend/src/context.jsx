import { createContext, useContext, useState } from 'react'

const Ctx = createContext(null)

export function PeriodProvider({ children }) {
  const [dateFrom, setDateFrom] = useState('2025-01')
  const [dateTo, setDateTo]     = useState('2025-12')

  return (
    <Ctx.Provider value={{ dateFrom, setDateFrom, dateTo, setDateTo }}>
      {children}
    </Ctx.Provider>
  )
}

export const usePeriod = () => useContext(Ctx)
