import React, { useState, useEffect } from "react";
import "./StudyHubNavbar.css";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  ArrowLeft,
  Menu,
  X,
  WalletCards,
  Bot,
  Clipboard,
  Home,
  Apple,
  Timer
} from "lucide-react";

import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const StudyHubNavbar = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(true);
  const { isLoggedIn } = useAuth();
  const [profileImage, setProfileImage] = useState('https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png');
  const [userName, setUserName] = useState('');

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useEffect(() => {
    const fetchProfileImage = async () => {
      if (isLoggedIn) {
        try {
          // Get token from localStorage
          const token = localStorage.getItem('authToken');

          // Set up headers with token if available
          const headers = {};
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }

          // Add a timestamp parameter to prevent caching
          const timestamp = new Date().getTime();
          const response = await api.get(`/router/profile-image?_t=${timestamp}`, { headers });

          if (response.data.success) {
            setProfileImage(response.data.profileImage);
            setUserName(response.data.username);
          }
          console.log('Profile image fetched successfully:', response.data.profileImage);
          console.log('Username fetched successfully:', response.data.username);
          console.log('Raw response data:', response.data);
        } catch (error) {
          // Only log the error if it's not a 401 Unauthorized (expected when not logged in)
          if (error.response && error.response.status !== 401) {
            console.error('Error fetching profile image:', error);
          }
        }
      }
    };

    fetchProfileImage();
  }, [isLoggedIn]);


  return (
    <div>
      {/* Overlay for mobile menu */}
      {isMenuOpen && <div className="overlay" onClick={toggleMenu}></div>}

      {/* Mobile burger menu button */}
      <div className="mobile-menu-button" onClick={toggleMenu}>
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </div>

      {/* Sidebar Navigation */}
      <div className={`main-div-study ${isMenuOpen ? "menu-open" : ""}`}>
        <ul>
          <li onClick={() => navigate("/")}>
            <ArrowLeft />
          </li>

          <li
            onMouseOver={() => setHidden(false)}
            onMouseOut={() => setHidden(true)}
          >
            <NavLink
              to="/studyhome"
              className={({ isActive }) =>
                isActive ? "active-1" : "notactive-1"
              }
              onClick={() => setIsMenuOpen(false)}
              aria-label="Home"
            >
              <div className="nav-item">
                <Home />
                {!hidden && <span>Home</span>}
              </div>
            </NavLink>
          </li>

          <li
            onMouseOver={() => setHidden(false)}
            onMouseOut={() => setHidden(true)}
          >
            <NavLink
              to="/calendar"
              className={({ isActive }) =>
                isActive ? "active-1" : "notactive-1"
              }
              onClick={() => setIsMenuOpen(false)}
              aria-label="Calendar"
            >
              <div className="nav-item">
                <CalendarIcon />
                {!hidden && <span>Calendar</span>}
              </div>
            </NavLink>
          </li>

          <li
            onMouseOver={() => setHidden(false)}
            onMouseOut={() => setHidden(true)}
          >
            <NavLink
              to="/flashcards"
              className={({ isActive }) =>
                isActive ? "active-1" : "notactive-1"
              }
              onClick={() => setIsMenuOpen(false)}
              aria-label="Flashcards"
            >
              <div className="nav-item">
                <WalletCards />
                {!hidden && <span>Flashcards</span>}
              </div>
            </NavLink>
          </li>

          <li
            onMouseOver={() => setHidden(false)}
            onMouseOut={() => setHidden(true)}
          >
            <NavLink
              to="/aichat"
              className={({ isActive }) =>
                isActive ? "active-1" : "notactive-1"
              }
              onClick={() => setIsMenuOpen(false)}
              aria-label="AI Chat"
            >
              <div className="nav-item">
                <Bot />
                {!hidden && <span>AI Chat</span>}
              </div>
            </NavLink>
          </li>

          <li
            onMouseOver={() => setHidden(false)}
            onMouseOut={() => setHidden(true)}
          >
            <NavLink
              to="/studytechniques"
              className={({ isActive }) =>
                isActive ? "active-1" : "notactive-1"
              }
              onClick={() => setIsMenuOpen(false)}
              aria-label="Study Techniques"
            >
              <div className="nav-item">
                <Clipboard />
                {!hidden && <span>Study Techniques</span>}
              </div>
            </NavLink>
          </li>
          <li
            onMouseOver={() => setHidden(false)}
            onMouseOut={() => setHidden(true)}
          >
            <NavLink
              to="/pomodoro"
              className={({ isActive }) =>
                isActive ? "active-1" : "notactive-1"
              }
              onClick={() => setIsMenuOpen(false)}
              aria-label="Pomodoro"
            >
              <div className="nav-item">
                <Timer />
                {!hidden && <span>Pomodoro</span>}
              </div>
            </NavLink>
          </li>

        </ul>
        <div 
  className="profile-button-study-navbar"
  onMouseEnter={() => setHidden(false)}
  onMouseLeave={() => setHidden(true)}
>
  <img 
    onClick={() => navigate("/profile")} 
    src={profileImage} 
    alt="Profile" 
    className="profile-image-study-navbar" 
  />
  {!hidden && (
    <span className="username-study-navbar">
      {!isLoggedIn ? 'Hi user' : `Hi, ${userName}`}
    </span>
  )}
</div>

      </div>
    </div>
  );
};

export default StudyHubNavbar;
