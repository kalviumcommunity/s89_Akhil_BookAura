import React, { useState } from 'react'
import axios from 'axios';

const Forgotpassword = () => {
  const [form,setForm] = useState({email:""});
  const [hidden,setHidden] = useState(false);
  const [code,setCode] =useState("");
  const [newpassword,setNewPassword]=useState("");
  const handleSubmit = async(e)=>{
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/router/forgotpassword', form, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log("code sent to your email");
      setHidden(true);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.msg) {
        alert("Error: " + error.response.data.msg);
      } else {
        alert("Unknown error occurred");
      }
      console.log("error in forgotpassword",error);
    }
  }

  const handlecode =async (e)=>{
    e.preventDefault();
    try {
      
           await axios.put('http://localhost:5000/router/resetpassword',{email:form.email,code,newpassword},{ withCredentials: true })
      console.log('password chaged sucessfully')
    } catch (error) {
      console.log("error in reseting the password",error);
    }
  }
  return (
    
    <div>
      <form onSubmit={handleSubmit}>
        <h1>Forgotpassword</h1>
        <label htmlFor="">Email</label>
        <input type="email" placeholder='email...' value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} />
        <input type="submit" onClick={handleSubmit}/>
        {hidden &&(
          <>
          <label htmlFor="">Code</label>
          <input type="text" placeholder='code...' value={code} onChange={(e)=>setCode(e.target.value)} />
          <label htmlFor="">newPassword</label>
          <input type="password" placeholder='newpassword' value={newpassword} onChange={(e)=>setNewPassword(e.target.value)} />
          <input type="submit" value="Reset Password" onClick={handlecode} />
          </>
        )}
      </form>
    </div>
    
  )
}

export default Forgotpassword;
