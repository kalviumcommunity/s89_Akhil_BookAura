import React from "react";
import "./StudyHubNavbar.css";
import { useNavigate, useLocation } from "react-router-dom";
import Calendar from "../pages/studyhub/calendar";
const StudyHubNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div>
      <div className="main-div-study">
        <ul>
          <li onClick={() => navigate("/home")}>Back to Main Home</li>
          <li
            className={
              location.pathname === "/studyhome" ? "active-1" : "notactive-1"
            }
            onClick={() => navigate("/studyhome")}
          >
            Home
          </li>
          <li
            className={
              location.pathname.startsWith("/calendar") ? "active" : "notactive"
            }
            onClick={() => navigate("/calendar")}
          >
            <Calendar size={16} className="nav-icon" />
            Calendar
          </li>
          <li
            className={
              location.pathname === "/flashcards" ? "active-1" : "notactive-1"
            }
            onClick={() => navigate("/flashcards")}
          >
            Flashcards
          </li>
          <li
            className={
              location.pathname === "/aichat" ? "active-1" : "notactive-1"
            }
            onClick={() => navigate("/aichat")}
          >
            Ai chat
          </li>
        </ul>
      </div>
    </div>
  );
};

export default StudyHubNavbar;
