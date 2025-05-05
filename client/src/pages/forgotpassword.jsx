import React, { useState } from 'react';
import axios from 'axios';
import AuthImage from '../images/Auth.png';
import '../pagescss/Auth.css';
import { useNavigate } from 'react-router-dom';
const Forgotpassword = () => {
  const [form, setForm] = useState({ email: "" });
  const [hidden, setHidden] = useState(false);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/router/forgotpassword', form, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log("Code sent to your email");
      setHidden(true);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.msg) {
        alert("Error: " + error.response.data.msg);
      } else {
        alert("Unknown error occurred");
      }
      console.error("Error in forgot password:", error);
    }
  };

  const handleCode = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:5000/router/resetpassword',
        { email: form.email, code, newpassword: newPassword }
      );
      await setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000); 
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      console.log('Password changed successfully')
    } catch (error) {
      console.error("Error in resetting the password:", error);
    }
  };

  return (
    <div className='boxes'>
      <div className='colourbox'>
        <img className='authimage' src={AuthImage} alt="Login" />
        <br />
      </div>
      <div className='loginbox'>
        <div className='login-form'>
        <h1>Forgot Password</h1>
        
        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input 
            type="email" 
            placeholder="Enter your email..." 
            value={form.email} 
            onChange={(e) => setForm({ ...form, email: e.target.value })} 
          />
          <input type="submit" value="Submit" />
          {hidden && (
            <>
              <label>Code</label>
              <input 
                type="text" 
                placeholder="Enter the code..." 
                value={code} 
                onChange={(e) => setCode(e.target.value)} 
              />
              <label>New Password</label>
              <input 
                type="password" 
                placeholder="Enter new password..." 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
              />
              <input type="submit" value="Reset Password" onClick={handleCode} />
            </>
          )}
        </form>
        </div>
      </div>
      {success && 
          <div className="success-message">Password changed successfully!</div>
          }
    </div>
  );
};

export default Forgotpassword;