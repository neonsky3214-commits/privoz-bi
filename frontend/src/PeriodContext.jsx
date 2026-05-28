import { createContext, useContext, useState } from 'react'

const Ctx = createContext()

export function PeriodProvider({ children }) {
  const [period, setPeriod] = useState('2025-05')
  const [range, setRange]   = useState('month') // week | month | quarter | year

  const PERIODS = [
    { value:'2025-05', label:'Май 25' },
    { value:'2025-04', label:'Апр 25' },
    { value:'2025-03', label:'Мар 25' },
    { value:'2025-02', label:'Фев 25' },
    { value:'2025-01', label:'Янв 25' },
  ]

  return (
    <Ctx.Provider value={{ period, setPeriod, range, setRange, PERIODS }}>
      {children}
    </Ctx.Provider>
  )
}

export const usePeriod = () => useContext(Ctx)
