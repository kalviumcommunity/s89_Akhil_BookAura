import React from 'react'
import { useState } from 'react'
import axios from 'axios'
import '../pagescss/login.css'
const Login = () => {
    const [form,setForm]=useState({email:"",password:""})
const handleSubmit= async(e)=>{
    e.preventDefault();
    try {
        await axios.post("http://localhost:5000/router/login", form, { withCredentials: true });
        console.log("Login successful");
    } catch (error) {
        console.error("Error logging in:", error);
    }

}

const handleGoogle = async(e) =>{
    try {
        await axios.get("http://localhost:5000/router/login")
    } catch (error) {
        onsole.error("Error logging in:", error);
    }
}
  return (
    <>
    <div className='boxes'>
    <div className='colourbox'>
      <h2>BookAura</h2>
      <h1>Welcome to</h1>
      <h1> BookAura</h1>
      <br />
      <p>Step into the future of digital reading.</p>
      <p> Your neon-lit library awaits.</p>
      <img src="https://images.stockcake.com/public/c/e/9/ce956fa4-37f2-4738-b3c2-650d7bb4f067_large/enchanted-forest-book-stockcake.jpg" alt="" />
    </div>
    <div className='loginbox'>
      <h1>Sign In</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="">Email</label>
        <input type="text" placeholder='Email...' value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} required />
        <label htmlFor="">Password</label>
        <input type="password" placeholder='Password' value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} required />
        <a href="/forgotpassword">Forgot Password</a>
        <input type="submit" />
        <div className="solid-line-with-text">
        <div className="line"></div>
        <span>or sign in with</span>
        <div className="line"></div>
        </div>
      </form>
      <div className='google-signin' onClick={handleGoogle}>
        <p>Google</p>
      </div>
    </div>
    </div>
    </>
  )
}

export default Login
