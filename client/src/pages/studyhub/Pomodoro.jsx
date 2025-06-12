import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings, Coffee, Briefcase, Timer } from 'lucide-react';
import './Pomodoro.css';
import StudyHubNavbar from '../../components/StudyHubNavbar';

const Pomodoro = () => {
  const [sessionConfig, setSessionConfig] = useState({
    work: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  });

  const [currentSession, setCurrentSession] = useState('work');
  const [timeLeft, setTimeLeft] = useState(sessionConfig.work);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const sessionInfo = {
    work: { label: 'Focus Time', icon: Briefcase },
    shortBreak: { label: 'Short Break', icon: Coffee },
    longBreak: { label: 'Long Break', icon: Timer },
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const total = sessionConfig[currentSession];
    return ((total - timeLeft) / total) * 100;
  };

  const playNotificationSound = useCallback(() => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }, []);

  const switchSession = useCallback(() => {
    if (currentSession === 'work') {
      setCompletedPomodoros((prev) => prev + 1);
      const newSession = (completedPomodoros + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
      setCurrentSession(newSession);
      setTimeLeft(sessionConfig[newSession]);
    } else {
      setCurrentSession('work');
      setTimeLeft(sessionConfig.work);
    }
    setIsRunning(false);
    playNotificationSound();
  }, [currentSession, completedPomodoros, sessionConfig, playNotificationSound]);

  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      switchSession();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, switchSession]);

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(sessionConfig[currentSession]);
  };

  const handleSessionChange = (session) => {
    setCurrentSession(session);
    setTimeLeft(sessionConfig[session]);
    setIsRunning(false);
  };

  const updateSessionConfig = (session, minutes) => {
    const newConfig = { ...sessionConfig, [session]: minutes * 60 };
    setSessionConfig(newConfig);
    if (currentSession === session) {
      setTimeLeft(minutes * 60);
      setIsRunning(false);
    }
  };

  const currentSessionInfo = sessionInfo[currentSession];
  const Icon = currentSessionInfo.icon;

  return (
    <>
    <StudyHubNavbar />
    <div className={`pomodoro-container ${currentSession}`}>
      <div className="pomodoro-wrapper">
        <h1 className="pomodoro-title">Pomodoro Focus</h1>
        <p className="pomodoro-subtitle">Stay focused and productive with the Pomodoro Technique</p>

        <div className="session-selector">
          {Object.entries(sessionInfo).map(([key, info]) => (
            <button
              key={key}
              className={`session-button ${currentSession === key ? 'active' : ''}`}
              onClick={() => handleSessionChange(key)}
            >
              <info.icon size={16} /> {info.label}
            </button>
          ))}
        </div>

        <div className="timer-circle">
          <svg className="circle-background" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" className="background-circle" />
            <circle
              cx="50"
              cy="50"
              r="45"
              className="progress-circle"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
            />
          </svg>
          <div className="timer-display">
            <div className="timer-icon"><Icon size={24} /></div>
            <div className="timer-time">{formatTime(timeLeft)}</div>
            <div className="timer-label">{currentSessionInfo.label}</div>
          </div>
        </div>

        <div className="control-buttons">
          <button onClick={handleStartPause} className="btn primary">
            {isRunning ? <Pause size={20} /> : <Play size={20} />} {isRunning ? 'Pause' : 'Start'}
          </button>
          <button onClick={handleReset} className="btn reset">
            <RotateCcw size={20} /> Reset
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="btn settings">
            <Settings size={20} /> Settings
          </button>
        </div>


        {showSettings && (
          <div className="settings-panel">
            <h3>Timer Settings</h3>
            <div className="settings-grid">
              {Object.entries(sessionInfo).map(([key, info]) => (
                <div key={key} className="settings-group">
                  <label>{info.label}</label>
                  <div className="settings-input">
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={Math.floor(sessionConfig[key] / 60)}
                      onChange={(e) => updateSessionConfig(key, parseInt(e.target.value) || 1)}
                    />
                    <span>minutes</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="tips-grid">
          {[{ icon: '🎯', title: 'Focus', desc: 'Work on one task at a time' },
            { icon: '⏰', title: 'Time-boxed', desc: '25 minutes of focused work' },
            { icon: '☕', title: 'Take breaks', desc: 'Rest between sessions' },
            { icon: '📈', title: 'Track progress', desc: 'Build momentum daily' }
          ].map((tip, index) => (
            <div key={index} className="tip-card">
              <div className="tip-icon">{tip.icon}</div>
              <h4>{tip.title}</h4>
              <p>{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
};

export default Pomodoro;