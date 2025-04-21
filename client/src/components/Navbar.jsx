import React from 'react';
import './Navbar.css'
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  return (
    <div className='navbar'>
     
        <div className='left' onClick={()=>navigate('/home')}>BookAura</div>
        <ul className='right'>
        <li onClick={()=>navigate('/home')}>Home</li>
        <li onClick={()=>navigate('/marketplace')}>Marketplace</li>
        <li onClick={()=>navigate('/login')}>Login</li>
      </ul>
    </div>
  );
};

export default Navbar;