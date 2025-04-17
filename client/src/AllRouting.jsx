import React from 'react'
import Forgotpassword from './pages/forgotpassword'
import {Routes,Route} from 'react-router-dom'
import Login from './pages/login'
import Signup from './pages/signup'
const AllRouting = () => {
  return (
    <div>
      <Routes>
        <Route path='/login' element={<Login/>} />
        <Route path='/signup' element={<Signup/>} />
        <Route path='/forgotpassword' element={<Forgotpassword/>} />
      </Routes>
    </div>
  )
}

export default AllRouting
