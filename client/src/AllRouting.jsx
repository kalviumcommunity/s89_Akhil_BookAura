import React from 'react'
import Forgotpassword from './pages/forgotpassword'
import {Routes,Route} from 'react-router-dom'
import Login from './pages/login'
import Signup from './pages/signup'
import Home from './pages/Home'
import Marketplace from './pages/Marketplace'
const AllRouting = () => {
  return (
    <div>
      <Routes>
        <Route path='/login' element={<Login/>} />
        <Route path='/signup' element={<Signup/>} />
        <Route path='/forgotpassword' element={<Forgotpassword/>} />
        <Route path='/home' element={<Home/>}/>
        <Route path='/marketplace' element={<Marketplace/>}></Route>
      </Routes>
    </div>
  )
}

export default AllRouting
