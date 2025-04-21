import React from 'react'
import axios from 'axios';
import { useState } from 'react'

const Signup = () => {
    const [form,setForm] = useState({username:'',email:'',password:''})

    const handelSubmit = async (e)=>{
      e.preventDefault();
      try {
        await axios.post('http://localhost:5000/router/signup',form, { withCredentials: true })
        console.log("signup successful");
      } catch (error) {
        console.error("Error sigin in:", error);
      }
    }
  return (
    <div>
      <form onSubmit={handelSubmit}>
        <h1>Signup</h1>
        <label htmlFor="">UserName</label>
        <input type="text" placeholder='username...' value={form.username} onChange={(e)=>setForm({...form,username:e.target.value})} required />
        <label htmlFor="">email</label>
        <input type="text" placeholder='email...' value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} required/>
        <label htmlFor="">Password</label>
        <input type="password" placeholder='password' value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} required />
        <input type="submit" onClick={handelSubmit} />
      </form>
    </div>
  )
}

export default Signup
