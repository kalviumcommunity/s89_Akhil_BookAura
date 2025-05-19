import React, { useState } from "react";
import "./StudyHubNavbar.css";
import { useNavigate, useLocation } from "react-router-dom";
import { Calendar as CalendarIcon, ArrowLeft, Menu, X } from "lucide-react";



const StudyHubNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div>
      {/* Mobile burger menu button */}
      <div className="mobile-menu-button" onClick={toggleMenu}>
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </div>

      {/* Main navigation */}
      <div className={`main-div-study ${isMenuOpen ? 'menu-open' : ''}`}>
        <ul>
          <li onClick={() => navigate("/")}><ArrowLeft size={15}/>Back to Main Home</li>
          <li
            className={
              location.pathname === "/studyhome" ? "active-1" : "notactive-1"
            }
            onClick={() => {
              navigate("/studyhome");
              setIsMenuOpen(false);
            }}
          >
            Home
          </li>
          <li
            className={
              location.pathname.startsWith("/calendar") ? "active" : "notactive"
            }
            onClick={() => {
              navigate("/calendar");
              setIsMenuOpen(false);
            }}
          >
            <CalendarIcon size={16} className="nav-icon" />
            Calendar
          </li>
          <li
            className={
              location.pathname === "/flashcards" ? "active-1" : "notactive-1"
            }
            onClick={() => {
              navigate("/flashcards");
              setIsMenuOpen(false);
            }}
          >
            <FlashcardsIcon size={16} className="nav-icon" /> Flashcards
          </li>
          <li
            className={
              location.pathname === "/aichat" ? "active-1" : "notactive-1"
            }
            onClick={() => {
              navigate("/aichat");
              setIsMenuOpen(false);
            }}
          >
            Ai chat
          </li>
        </ul>
      </div>
    </div>
  );
};

export default StudyHubNavbar;
