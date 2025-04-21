import { useState } from 'react'
import './App.css'
import { BrowserRouter } from 'react-router-dom'
import AllRouting from './AllRouting'

function App() {
  return (
    <div>
      <BrowserRouter>
      <AllRouting />
      </BrowserRouter>
    </div>
  )
}

export default App
