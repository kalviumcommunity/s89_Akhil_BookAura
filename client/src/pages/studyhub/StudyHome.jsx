import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudyHubNavbar from '../../components/StudyHubNavbar';
import './StudyHome.css';
import {
  ChevronRight,
  Calendar,
  BookOpen,
  Brain,
  MessageSquare,
  Clock,
  TrendingUp,
  Award,
  BookMarked
} from 'lucide-react';
import moment from 'moment';
import { useSchedule } from '../../context/ScheduleContext';

const StudyHome = () => {
  const navigate = useNavigate();
  const { schedules, loading, error, fetchSchedules } = useSchedule();

  // Refresh schedules when component mounts
  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Function to navigate to calendar page
  const goToCalendar = () => {
    navigate('/calendar');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="study-home-container">
        <StudyHubNavbar />
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
        <StudyHubNavbar />
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

  // Get upcoming schedules (next 3 days)
  const upcomingSchedules = schedules
    .filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      const today = new Date();
      const threeDaysLater = new Date();
      threeDaysLater.setDate(today.getDate() + 3);
      return scheduleDate >= today && scheduleDate <= threeDaysLater;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  return (
    <div className="study-home-container">
      <StudyHubNavbar />

      <div className="study-content">
        {/* Hero Section */}
        <div className="study-hero">
          <div className="hero-content">
            <h1>Welcome to StudyHub</h1>
            <p>Your personal learning hub for organizing study schedules and enhancing your reading experience</p>

            <div className="hero-stats">
              <div className="stat-item">
                <Clock size={40} />
                <div>
                  <h3>{schedules.length}</h3>
                  <p>Study Sessions</p>
                </div>
              </div>
              <div className="stat-item">
                <BookMarked size={40} />
                <div>
                  <h3>24/7</h3>
                  <p>Learning Access</p>
                </div>
              </div>
              <div className="stat-item">
                <Award size={40} />
                <div>
                  <h3>100%</h3>
                  <p>Success Rate</p>
                </div>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <div className="image-placeholder">
              <Brain size={80} className="hero-icon" />
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="features-section">
          <h2>Explore Features</h2>

          <div className="features-grid">
            <div className="feature-card" onClick={() => navigate('/calendar')}>
              <div className="feature-icon">
                <Calendar size={24} />
              </div>
              <h3>Calendar</h3>
              <p>Schedule and manage your study sessions efficiently</p>
              <button className="feature-btn">
                <ChevronRight size={16} />
                Open Calendar
              </button>
            </div>

            <div className="feature-card" onClick={() => navigate('/flashcards')}>
              <div className="feature-icon">
                <BookOpen size={24} />
              </div>
              <h3>Flashcards</h3>
              <p>Create and review flashcards to reinforce your learning</p>
              <button className="feature-btn">
                <ChevronRight size={16} />
                Study Now
              </button>
            </div>

            <div className="feature-card" onClick={() => navigate('/aichat')}>
              <div className="feature-icon">
                <MessageSquare size={24} />
              </div>
              <h3>AI Chat</h3>
              <p>Get instant help with your questions and study materials</p>
              <button className="feature-btn">
                <ChevronRight size={16} />
                Start Chatting
              </button>
            </div>

            <div className="feature-card" onClick={() => navigate('/my-books')}>
              <div className="feature-icon">
                <BookMarked size={24} />
              </div>
              <h3>My Books</h3>
              <p>Access your purchased books and study materials</p>
              <button className="feature-btn">
                <ChevronRight size={16} />
                View Library
              </button>
            </div>
          </div>
        </div>

        {/* Upcoming Schedule Section */}
        <div className="upcoming-section">
          <div className="section-header">
            <h2>Upcoming Schedule</h2>
            <button className="view-all-btn" onClick={() => navigate('/calendar')}>
              View All
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="schedule-cards">
            {upcomingSchedules.length > 0 ? (
              upcomingSchedules.map((schedule) => {
                const scheduleDate = new Date(schedule.date);
                return (
                  <div className="schedule-card" key={schedule.id}>
                    <div className="schedule-card-date">
                      <span className="schedule-day">{scheduleDate.getDate()}</span>
                      <span className="schedule-month">
                        {scheduleDate.toLocaleString('default', { month: 'short' })}
                      </span>
                    </div>
                    <div className="schedule-card-content">
                      <h3>{schedule.title}</h3>
                      <p className="schedule-time">{schedule.time}</p>
                      <p className="schedule-desc">{schedule.description}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-schedules-card">
                <Clock size={32} />
                <h3>No Upcoming Sessions</h3>
                <p>You don't have any study sessions scheduled for the next few days.</p>
                <button className="schedule-now-btn" onClick={() => navigate('/calendar')}>
                  Schedule Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Tips Section */}
        <div className="tips-section">
          <h2>Study Tips</h2>
          <div className="tips-container">
            <div className="tip-card">
              <div className="tip-number">01</div>
              <h3>Set Clear Goals</h3>
              <p>Define specific, measurable goals for each study session to stay focused and track progress.</p>
            </div>
            <div className="tip-card">
              <div className="tip-number">02</div>
              <h3>Use Active Recall</h3>
              <p>Test yourself regularly instead of passive re-reading to strengthen memory retention.</p>
            </div>
            <div className="tip-card">
              <div className="tip-number">03</div>
              <h3>Take Regular Breaks</h3>
              <p>Follow the Pomodoro Technique: 25 minutes of focused study followed by a 5-minute break.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyHome;
