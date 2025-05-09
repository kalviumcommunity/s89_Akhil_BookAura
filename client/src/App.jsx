import { useState } from 'react'
import './App.css'
import { BrowserRouter } from 'react-router-dom'
import AllRouting from './AllRouting'
import { CartProvider } from './pages/MarketPlace/cart'
import { ScheduleProvider } from './context/ScheduleContext'

function App() {
  return (
    <div>
      <BrowserRouter>
        <CartProvider>
          <ScheduleProvider>
            <AllRouting />
          </ScheduleProvider>
        </CartProvider>
      </BrowserRouter>
    </div>
  )
}

export default App
