import { createContext, useContext, useState } from 'react'

const PrintContext = createContext()

export function PrintProvider({ children }) {
  const [isPrinting, setIsPrinting] = useState(false)

  return (
    <PrintContext.Provider value={{ isPrinting, setIsPrinting }}>
      {children}
    </PrintContext.Provider>
  )
}

export function usePrintContext() {
  const context = useContext(PrintContext)
  if (!context) {
    throw new Error('usePrintContext must be used within PrintProvider')
  }
  return context
}
