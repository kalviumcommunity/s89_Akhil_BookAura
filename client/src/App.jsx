import { useState } from 'react'
import './App.css'
import { BrowserRouter } from 'react-router-dom'
import AllRouting from './AllRouting'
import { CartProvider } from './pages/MarketPlace/cart'
import { ScheduleProvider } from './context/ScheduleContext'
import { AuthProvider } from './context/AuthContext'

import LibreTranslate from './components/LibreTranslate';

function App() {
  return (
    <div>
      <LibreTranslate />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <ScheduleProvider>
              <AllRouting />
            </ScheduleProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  )
}

export default App
