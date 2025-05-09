import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LeftNavbar from '../../components/StudyHubNavbar';
import './StudyHome.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import moment from 'moment';
import { useSchedule } from '../../context/ScheduleContext';

const StudyHome = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const { schedules, loading, error, fetchSchedules } = useSchedule();

  // Refresh schedules when component mounts
  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Function to navigate to calendar page
  const goToCalendar = () => {
    navigate('/calendar');
  };

  // Function to navigate to previous/next month
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Get current month's days
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: '', isCurrentMonth: false });
    }

    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const hasEvent = schedules.some(schedule =>
        date.getDate() === schedule.date.getDate() &&
        date.getMonth() === schedule.date.getMonth() &&
        date.getFullYear() === schedule.date.getFullYear()
      );

      days.push({
        day: i,
        isCurrentMonth: true,
        hasEvent,
        date
      });
    }

    return days;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="study-home-container">
        <LeftNavbar />
        <div className="study-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your study schedule...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="study-home-container">
        <LeftNavbar />
        <div className="study-content">
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button className="retry-button" onClick={fetchSchedules}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="study-home-container">
      <LeftNavbar />

      <div className="study-content">
        <div className="study-welcome">
          <h1>StudyDome</h1>
          <p>Your personal learning hub for organizing study schedules and enhancing your reading experience</p>

          <div className="quick-nav-buttons">
            <button className="nav-feature-btn" onClick={() => navigate('/calendar')}>
              <ChevronRight size={16} />
              Calendar
            </button>
            <button className="nav-feature-btn" onClick={() => navigate('/flashcards')}>
              <ChevronRight size={16} />
              Flashcards
            </button>
            <button className="nav-feature-btn" onClick={() => navigate('/aichat')}>
              <ChevronRight size={16} />
              AI Chat
            </button>
            <button className="nav-feature-btn" onClick={() => navigate('/my-books')}>
              <ChevronRight size={16} />
              My Books
            </button>
          </div>
        </div>

        <div className="study-calendar-section">
          <div className="calendar-header">
            <h2>Study Schedule</h2>
            <div className="calendar-navigation">
              <button onClick={() => navigateMonth('prev')} className="nav-button">
                <ChevronLeft size={18} />
              </button>
              <h3>{moment(currentDate).format('MMMM YYYY')}</h3>
              <button onClick={() => navigateMonth('next')} className="nav-button">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="simple-calendar">
            <div className="calendar-weekdays">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                <div key={index} className="weekday">{day}</div>
              ))}
            </div>
            <div className="calendar-days">
              {getDaysInMonth().map((day, index) => (
                <div
                  key={index}
                  className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.hasEvent ? 'has-event' : ''}`}
                >
                  {day.day}
                  {day.hasEvent && <div className="event-indicator"></div>}
                </div>
              ))}
            </div>
          </div>

          <div className="upcoming-schedules">
            <h3>Upcoming Sessions</h3>

            {schedules.length > 0 ? (
              schedules.map(schedule => (
                <div key={schedule.id} className="schedule-item">
                  <div className="schedule-date">
                    <div className="schedule-day">{moment(schedule.date).format('DD')}</div>
                    <div className="schedule-month">{moment(schedule.date).format('MMM')}</div>
                  </div>
                  <div className="schedule-details">
                    <h4>{schedule.title}</h4>
                    <p className="schedule-time">{schedule.time}</p>
                    <p className="schedule-description">{schedule.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-schedules">
                <p>You don't have any upcoming study sessions.</p>
                <p>Create your first session to get started!</p>
              </div>
            )}

            <button className="view-all-button" onClick={goToCalendar}>
              {schedules.length > 0 ? 'View Full Calendar' : 'Create New Session'}
            </button>
          </div>
        </div>
      </div>

      {/* Persistent Schedule Reminder */}
      <div className="schedule-reminder">
        <div className="reminder-content">
          <h4>Next Session</h4>
          {schedules.length > 0 ? (
            <div className="reminder-details">
              <p className="reminder-title">{schedules[0].title}</p>
              <p className="reminder-time">
                {moment(schedules[0].date).format('MMM DD')} • {schedules[0].time}
              </p>
            </div>
          ) : (
            <div className="reminder-details">
              <p className="reminder-title">No upcoming sessions</p>
              <p className="reminder-time">Schedule your first study session</p>
            </div>
          )}
        </div>
        <button className="reminder-btn" onClick={goToCalendar}>
          {schedules.length > 0 ? 'View Calendar' : 'Create Session'}
        </button>
      </div>
    </div>
  );
};

export default StudyHome;
