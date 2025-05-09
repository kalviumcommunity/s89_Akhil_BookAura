import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';
import CronofyService from '../../services/CronofyService';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import axios from 'axios';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarPage.css';
import { Calendar as CalendarIcon, Clock, User, Book, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import StudyHubNavbar from '../../components/StudyHubNavbar';

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

// Custom toolbar component for enhanced navigation
const CustomToolbar = (toolbar) => {
  const goToToday = () => {
    toolbar.onNavigate('TODAY');
  };

  const goToPrev = () => {
    toolbar.onNavigate('PREV');
  };

  const goToNext = () => {
    toolbar.onNavigate('NEXT');
  };

  const goToMonth = () => {
    toolbar.onView('month');
  };

  const goToWeek = () => {
    toolbar.onView('week');
  };

  const goToDay = () => {
    toolbar.onView('day');
  };

  const goToAgenda = () => {
    toolbar.onView('agenda');
  };

  const label = () => {
    const date = moment(toolbar.date);
    return (
      <span className="calendar-navigation-label">
        {toolbar.view === 'month' && (
          <span>{date.format('MMMM YYYY')}</span>
        )}
        {toolbar.view === 'week' && (
          <span>Week of {date.startOf('week').format('MMM D')} - {date.endOf('week').format('MMM D, YYYY')}</span>
        )}
        {toolbar.view === 'day' && (
          <span>{date.format('dddd, MMMM D, YYYY')}</span>
        )}
        {toolbar.view === 'agenda' && (
          <span>{date.format('MMMM YYYY')}</span>
        )}
      </span>
    );
  };

  return (
    <div className="custom-toolbar">
      <div className="toolbar-section navigation">
        <button
          type="button"
          onClick={goToPrev}
          className="nav-button prev"
          aria-label="Previous"
        >
          <ChevronLeft size={18} />
          <span>Previous</span>
        </button>
        <button
          type="button"
          onClick={goToToday}
          className="nav-button today"
        >
          Today
        </button>
        <button
          type="button"
          onClick={goToNext}
          className="nav-button next"
          aria-label="Next"
        >
          <span>Next</span>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="toolbar-section label">
        {label()}
      </div>

      <div className="toolbar-section views">
        <button
          type="button"
          onClick={goToMonth}
          className={toolbar.view === 'month' ? 'active' : ''}
        >
          Month
        </button>
        <button
          type="button"
          onClick={goToWeek}
          className={toolbar.view === 'week' ? 'active' : ''}
        >
          Week
        </button>
        <button
          type="button"
          onClick={goToDay}
          className={toolbar.view === 'day' ? 'active' : ''}
        >
          Day
        </button>
        <button
          type="button"
          onClick={goToAgenda}
          className={toolbar.view === 'agenda' ? 'active' : ''}
        >
          Agenda
        </button>
      </div>
    </div>
  );
};

const CalendarPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendar, setSelectedCalendar] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: new Date(),
    end: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour from now
    description: '',
    location: '',
    attendees: [],
    color: '#A67C52' // Default color
  });
  const [newAttendee, setNewAttendee] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch events from MongoDB
  const fetchEventsFromMongoDB = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching events from MongoDB...');

      // Get the start and end of the current month for filtering
      const start = moment().startOf('month').format();
      const end = moment().endOf('month').format();

      console.log('Fetching events between', start, 'and', end);
      console.log('Auth status:', document.cookie.includes('token=') || document.cookie.includes('authToken=') ? 'Authenticated' : 'Not authenticated');

      const response = await axios.get('http://localhost:5000/api/events', {
        params: { start, end },
        withCredentials: true
      });

      if (response.data.success) {
        console.log('Successfully fetched events:', response.data.data.length);
        // Transform the events to the format expected by react-big-calendar
        const formattedEvents = response.data.data.map(event => ({
          id: event._id,
          title: event.title,
          start: new Date(event.start),
          end: new Date(event.end),
          description: event.description,
          location: event.location,
          attendees: event.attendees,
          color: event.color
        }));

        setEvents(formattedEvents);
      } else {
        console.log('Server returned unsuccessful response:', response.data);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching events:', error);

      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }

      // If there's an authentication error, show demo data
      if (error.response?.status === 401) {
        console.log('Authentication error, loading demo data');
        loadDemoData();
      } else {
        setError('Failed to load events. Please try again later.');
        setIsLoading(false);
      }
    }
  };

  // Function to load demo data
  const loadDemoData = () => {
    setIsLoading(false);
    setCalendars([
      { calendar_id: 'demo_calendar_1', calendar_name: 'Demo Calendar' }
    ]);
    setSelectedCalendar('demo_calendar_1');

    // Add some demo events
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    setEvents([
      {
        id: 'event1',
        title: 'Book Club Meeting',
        start: new Date(today.setHours(10, 0, 0, 0)),
        end: new Date(today.setHours(11, 30, 0, 0))
      },
      {
        id: 'event2',
        title: 'Reading Session',
        start: new Date(tomorrow.setHours(14, 0, 0, 0)),
        end: new Date(tomorrow.setHours(16, 0, 0, 0))
      }
    ]);
  };

  useEffect(() => {
    // Check if we're in development mode
    const isDevelopment = import.meta.env.DEV;
    console.log('Calendar initialization, development mode:', isDevelopment);

    // Try to fetch events from MongoDB first
    const isLoggedIn = document.cookie.includes('token=') || document.cookie.includes('authToken=');
    console.log('Auth status:', isLoggedIn ? 'Authenticated' : 'Not authenticated');

    if (isLoggedIn) {
      console.log('User is logged in, fetching events from MongoDB');
      // User is logged in, fetch events from MongoDB
      fetchEventsFromMongoDB();

      // Also set up a default calendar
      setCalendars([
        { calendar_id: 'mongodb_calendar', calendar_name: 'My Calendar' }
      ]);
      setSelectedCalendar('mongodb_calendar');
    } else if (isDevelopment) {
      console.log('Development mode without login, loading demo data');
      // In development mode without login, load demo data
      loadDemoData();
    } else if (CronofyService.isAuthenticated()) {
      console.log('User authenticated with Cronofy, fetching calendars');
      // If user is authenticated with Cronofy, fetch calendars
      const fetchCalendars = async () => {
        try {
          setIsLoading(true);
          const calendarsData = await CronofyService.getCalendars();
          setCalendars(calendarsData);

          if (calendarsData.length > 0) {
            setSelectedCalendar(calendarsData[0].calendar_id);
          }

          setIsLoading(false);
        } catch (err) {
          console.error('Error fetching calendars:', err);
          setError('Failed to load calendars. Please try again later.');
          setIsLoading(false);
        }
      };

      fetchCalendars();
    } else {
      console.log('No authentication found, redirecting to Cronofy authorization');
      // Redirect to Cronofy authorization
      window.location.href = CronofyService.getAuthorizationUrl();
    }
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        try {
          await CronofyService.getTokens(code);
          // Remove code from URL
          navigate('/calendar', { replace: true });
        } catch (err) {
          console.error('Error handling OAuth callback:', err);
          setError('Authentication failed. Please try again.');
        }
      }
    };

    if (window.location.pathname === '/calendar/callback') {
      handleOAuthCallback();
    }
  }, [navigate]);

  const handleSelectSlot = ({ start, end }) => {
    setNewEvent({
      ...newEvent,
      start,
      end
    });
    setShowEventModal(true);
  };

  const handleSelectEvent = (event) => {
    // View event details
    console.log('Selected event:', event);

    // Ask if the user wants to delete the event
    if (window.confirm(`Would you like to delete the event "${event.title}"?`)) {
      handleDeleteEvent(event);
    }
  };

  const handleDeleteEvent = async (event) => {
    try {
      // Check if user is logged in (check both cookie names)
      const isLoggedIn = document.cookie.includes('token=') || document.cookie.includes('authToken=');
      console.log('Deleting event, auth status:', isLoggedIn ? 'Authenticated' : 'Not authenticated');
      console.log('Event to delete:', event);

      if (isLoggedIn) {
        console.log('Deleting event from MongoDB...');
        // Delete from MongoDB
        const response = await axios.delete(`http://localhost:5000/api/events/${event.id}`, {
          withCredentials: true
        });

        if (response.data.success) {
          console.log('Event deleted successfully');
          // Remove the event from the local state
          setEvents(events.filter(e => e.id !== event.id));
        } else {
          console.error('Server returned unsuccessful response:', response.data);
          throw new Error('Failed to delete event from MongoDB');
        }
      } else {
        console.log('User not logged in, removing from local state only');
        // For Cronofy or demo events, just remove from local state
        setEvents(events.filter(e => e.id !== event.id));
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
      alert('Failed to delete event. Please try again.');
    }
  };

  const handleAddAttendee = () => {
    if (newAttendee && !newEvent.attendees.includes(newAttendee)) {
      setNewEvent({
        ...newEvent,
        attendees: [...newEvent.attendees, newAttendee]
      });
      setNewAttendee('');
    }
  };

  const handleRemoveAttendee = (attendee) => {
    setNewEvent({
      ...newEvent,
      attendees: newEvent.attendees.filter(a => a !== attendee)
    });
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title) {
      alert('Please enter an event title');
      return;
    }

    try {
      // Check if user is logged in (check both cookie names)
      const isLoggedIn = document.cookie.includes('token=') || document.cookie.includes('authToken=');
      console.log('Creating event, auth status:', isLoggedIn ? 'Authenticated' : 'Not authenticated');

      if (isLoggedIn) {
        console.log('Saving event to MongoDB...');
        // Save to MongoDB
        const mongoEventData = {
          title: newEvent.title,
          description: newEvent.description,
          start: newEvent.start,
          end: newEvent.end,
          location: newEvent.location,
          attendees: newEvent.attendees.map(email => ({ email })),
          calendarId: selectedCalendar || 'mongodb_calendar',
          color: newEvent.color || '#A67C52', // Use selected color or default
          isAllDay: false
        };

        console.log('Event data being sent:', mongoEventData);

        const response = await axios.post('http://localhost:5000/api/events', mongoEventData, {
          withCredentials: true
        });

        if (response.data.success) {
          console.log('Event saved successfully:', response.data.data);
          // Add the new event to the local state
          const savedEvent = response.data.data;
          setEvents([...events, {
            id: savedEvent._id,
            title: savedEvent.title,
            start: new Date(savedEvent.start),
            end: new Date(savedEvent.end),
            description: savedEvent.description,
            location: savedEvent.location,
            attendees: savedEvent.attendees,
            color: savedEvent.color
          }]);
        } else {
          console.error('Server returned unsuccessful response:', response.data);
          throw new Error('Failed to save event to MongoDB');
        }
      } else {
        console.log('User not logged in, using local storage or Cronofy...');
        // Use Cronofy for external calendars
        const eventData = {
          event_id: `event_${Date.now()}`,
          summary: newEvent.title,
          description: newEvent.description,
          start: moment(newEvent.start).format(),
          end: moment(newEvent.end).format(),
          location: {
            description: newEvent.location
          },
          attendees: newEvent.attendees.map(email => ({ email }))
        };

        // Check if we're in development mode
        const isDevelopment = import.meta.env.DEV;

        if (!isDevelopment && CronofyService.isAuthenticated()) {
          console.log('Using Cronofy for event creation');
          // In production with Cronofy auth, create the event in Cronofy
          await CronofyService.createEvent(selectedCalendar, eventData);
        }

        console.log('Adding event to local state');
        // Add to local events for demo mode
        setEvents([...events, {
          id: eventData.event_id,
          title: newEvent.title,
          start: newEvent.start,
          end: newEvent.end,
          description: newEvent.description,
          location: newEvent.location,
          attendees: newEvent.attendees
        }]);
      }

      // Reset form and close modal
      setNewEvent({
        title: '',
        start: new Date(),
        end: new Date(new Date().getTime() + 60 * 60 * 1000),
        description: '',
        location: '',
        attendees: [],
        color: '#A67C52' // Reset to default color
      });
      setShowEventModal(false);
    } catch (err) {
      console.error('Error creating event:', err);
      alert('Failed to create event. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <>
        <StudyHubNavbar />
        <div className="calendar-page loading">
          <div className="loading-spinner"></div>
          <p>Loading your calendar...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <StudyHubNavbar/>
        <div className="calendar-page error">
          <p className="error-message">{error}</p>
          <button
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <StudyHubNavbar/>
      <div className="calendar-page">
        <div className="calendar-container">
          <div className="calendar-header">
            <h1>Book Scheduling</h1>
            <p>Schedule reading sessions and book club meetings</p>

            {calendars.length > 0 && (
              <div className="calendar-selector">
                <label htmlFor="calendar-select">Calendar:</label>
                <select
                  id="calendar-select"
                  value={selectedCalendar || ''}
                  onChange={(e) => setSelectedCalendar(e.target.value)}
                >
                  {calendars.map(calendar => (
                    <option key={calendar.calendar_id} value={calendar.calendar_id}>
                      {calendar.calendar_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="calendar-view">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              views={['month', 'week', 'day', 'agenda']}
              defaultView="month"
              className="book-calendar"
              date={currentDate}
              onNavigate={(date) => {
                setCurrentDate(date);
                // Fetch events for the new date range if using MongoDB
                if (document.cookie.includes('token=') && selectedCalendar === 'mongodb_calendar') {
                  const start = moment(date).startOf('month').format();
                  const end = moment(date).endOf('month').format();

                  axios.get('http://localhost:5000/api/events', {
                    params: { start, end },
                    withCredentials: true
                  })
                  .then(response => {
                    if (response.data.success) {
                      const formattedEvents = response.data.data.map(event => ({
                        id: event._id,
                        title: event.title,
                        start: new Date(event.start),
                        end: new Date(event.end),
                        description: event.description,
                        location: event.location,
                        attendees: event.attendees,
                        color: event.color
                      }));

                      setEvents(formattedEvents);
                    }
                  })
                  .catch(error => {
                    console.error('Error fetching events for new date range:', error);
                  });
                }
              }}
              components={{
                toolbar: CustomToolbar,
                event: (props) => {
                  const { event } = props;
                  const eventColor = event.color || '#A67C52';

                  return (
                    <div
                      style={{
                        backgroundColor: eventColor,
                        color: '#fff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {event.title}
                    </div>
                  );
                }
              }}
            />
          </div>
        </div>

        {showEventModal && (
          <div className="event-modal-overlay">
            <div className="event-modal">
              <div className="event-modal-header">
                <h2>Create New Event</h2>
                <button
                  className="close-button"
                  onClick={() => setShowEventModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="event-form">
                <div className="form-group">
                  <label>
                    <Book size={16} />
                    Event Title
                  </label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    placeholder="Book Club Meeting"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <CalendarIcon size={16} />
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      value={moment(newEvent.start).format('YYYY-MM-DDTHH:mm')}
                      onChange={(e) => setNewEvent({...newEvent, start: new Date(e.target.value)})}
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Clock size={16} />
                      End Time
                    </label>
                    <input
                      type="datetime-local"
                      value={moment(newEvent.end).format('YYYY-MM-DDTHH:mm')}
                      onChange={(e) => setNewEvent({...newEvent, end: new Date(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    placeholder="Discuss chapters 1-5 of the current book"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                    placeholder="Online or physical location"
                  />
                </div>

                <div className="form-group">
                  <label>Event Color</label>
                  <div className="color-picker">
                    <input
                      type="color"
                      value={newEvent.color}
                      onChange={(e) => setNewEvent({...newEvent, color: e.target.value})}
                    />
                    <span className="color-preview" style={{ backgroundColor: newEvent.color }}></span>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <User size={16} />
                    Attendees
                  </label>
                  <div className="attendee-input">
                    <input
                      type="email"
                      value={newAttendee}
                      onChange={(e) => setNewAttendee(e.target.value)}
                      placeholder="Enter email address"
                    />
                    <button
                      className="add-attendee-button"
                      onClick={handleAddAttendee}
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {newEvent.attendees.length > 0 && (
                    <div className="attendees-list">
                      {newEvent.attendees.map((attendee, index) => (
                        <div key={index} className="attendee-tag">
                          <span>{attendee}</span>
                          <button
                            onClick={() => handleRemoveAttendee(attendee)}
                            className="remove-attendee"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    className="cancel-button"
                    onClick={() => setShowEventModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="create-button"
                    onClick={handleCreateEvent}
                  >
                    Create Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CalendarPage;
