import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import moment from 'moment';
import StudyHubNavbar from '../../components/StudyHubNavbar';
import { Plus, X, Trash2 } from 'lucide-react';

// FullCalendar imports
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import './Calendar.css'; // We'll create this file next

const Calendar = () => {
  // State for events
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start: '',
    end: '',
    location: '',
    color: '#A67C52', // Default color
    isAllDay: false
  });

  // Fetch events from the server
  const fetchEvents = useCallback(async (start, end) => {
    try {
      setLoading(true);
      const response = await axios.get('https://s89-akhil-bookaura-2.onrender.com/api/events', {
        params: { start, end },
        withCredentials: true
      });

      if (response.data.success) {
        // Transform events to the format expected by FullCalendar
        const formattedEvents = response.data.data.map(event => ({
          id: event._id,
          title: event.title,
          start: event.start,
          end: event.end,
          description: event.description || '',
          location: event.location || '',
          color: event.color || '#A67C52',
          allDay: event.isAllDay
        }));

        setEvents(formattedEvents);
      } else {
        setError('Failed to fetch events');
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to fetch events. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const start = moment().startOf('month').subtract(1, 'month').format();
    const end = moment().endOf('month').add(1, 'month').format();
    fetchEvents(start, end);
  }, [fetchEvents]);

  // Handle date range change
  const handleDatesSet = (calendarInfo) => {
    const start = moment(calendarInfo.start).format();
    const end = moment(calendarInfo.end).format();
    fetchEvents(start, end);
  };

  // Handle date click
  const handleDateClick = (info) => {
    // Set default times (9 AM to 10 AM on the clicked date)
    const clickedDate = moment(info.date).format('YYYY-MM-DD');
    const defaultStart = `${clickedDate}T09:00:00`;
    const defaultEnd = `${clickedDate}T10:00:00`;

    setFormData({
      title: '',
      description: '',
      start: defaultStart,
      end: defaultEnd,
      location: '',
      color: '#A67C52',
      isAllDay: info.allDay
    });

    setModalMode('add');
    setShowModal(true);
  };

  // Handle event click
  const handleEventClick = (info) => {
    const event = info.event;

    // Format dates for the form inputs
    const start = moment(event.start).format('YYYY-MM-DDTHH:mm:ss');
    const end = event.end ? moment(event.end).format('YYYY-MM-DDTHH:mm:ss') : moment(event.start).add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss');

    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.extendedProps.description || '',
      start: start,
      end: end,
      location: event.extendedProps.location || '',
      color: event.backgroundColor || '#A67C52',
      isAllDay: event.allDay
    });

    setModalMode('edit');
    setShowModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        start: new Date(formData.start).toISOString(),
        end: new Date(formData.end).toISOString(),
        location: formData.location,
        color: formData.color,
        isAllDay: formData.isAllDay,
        calendarId: 'mongodb_calendar'
      };

      let response;

      if (modalMode === 'add') {
        // Create new event
        response = await axios.post('https://s89-akhil-bookaura-2.onrender.com/api/events', eventData, {
          withCredentials: true
        });

        if (response.data.success) {
          // Add the new event to the state
          const newEvent = {
            id: response.data.data._id,
            title: response.data.data.title,
            start: response.data.data.start,
            end: response.data.data.end,
            description: response.data.data.description || '',
            location: response.data.data.location || '',
            color: response.data.data.color || '#A67C52',
            allDay: response.data.data.isAllDay
          };

          setEvents([...events, newEvent]);
        }
      } else {
        // Update existing event
        response = await axios.put(`https://s89-akhil-bookaura-2.onrender.com/api/events/${selectedEvent.id}`, eventData, {
          withCredentials: true
        });

        if (response.data.success) {
          // Update the event in the state
          setEvents(events.map(event =>
            event.id === selectedEvent.id
              ? {
                  ...event,
                  title: formData.title,
                  start: formData.start,
                  end: formData.end,
                  description: formData.description,
                  location: formData.location,
                  color: formData.color,
                  allDay: formData.isAllDay
                }
              : event
          ));
        }
      }

      // Close the modal
      setShowModal(false);
      setSelectedEvent(null);

      // Refresh events
      const start = moment().startOf('month').subtract(1, 'month').format();
      const end = moment().endOf('month').add(1, 'month').format();
      fetchEvents(start, end);

    } catch (err) {
      console.error('Error saving event:', err);
      setError('Failed to save event. Please try again later.');
    }
  };

  // Handle event deletion
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    try {
      const response = await axios.delete(`https://s89-akhil-bookaura-2.onrender.com/api/events/${selectedEvent.id}`, {
        withCredentials: true
      });

      if (response.data.success) {
        // Remove the event from the state
        setEvents(events.filter(event => event.id !== selectedEvent.id));

        // Close the modal
        setShowModal(false);
        setSelectedEvent(null);
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event. Please try again later.');
    }
  };

  return (
    <div className="calendar-container">
      <StudyHubNavbar />

      <div className="calendar-content">
        <div className="calendar-header">
          <h1>Calendar</h1>
          <p>Manage your study schedule and events</p>
          <button className="add-event-button" onClick={() => {
            setFormData({
              title: '',
              description: '',
              start: moment().format('YYYY-MM-DDTHH:mm:ss'),
              end: moment().add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss'),
              location: '',
              color: '#A67C52',
              isAllDay: false
            });
            setModalMode('add');
            setShowModal(true);
          }}>
            <Plus size={16} /> Add Event
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="calendar-wrapper">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            height="auto"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: 'short'
            }}
            loading={isLoading => setLoading(isLoading)}
          />
        </div>
      </div>

      {/* Event Modal */}
      {showModal && (
        <div className="event-modal-overlay">
          <div className="event-modal">
            <div className="event-modal-header">
              <h2>{modalMode === 'add' ? 'Add Event' : 'Edit Event'}</h2>
              <button className="close-button" onClick={() => {
                setShowModal(false);
                setSelectedEvent(null);
              }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                ></textarea>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="start">Start</label>
                  <input
                    type="datetime-local"
                    id="start"
                    name="start"
                    value={formData.start}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="end">End</label>
                  <input
                    type="datetime-local"
                    id="end"
                    name="end"
                    value={formData.end}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="color">Color</label>
                  <input
                    type="color"
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="isAllDay"
                      checked={formData.isAllDay}
                      onChange={handleInputChange}
                    />
                    All Day Event
                  </label>
                </div>
              </div>

              <div className="form-actions">
                {modalMode === 'edit' && (
                  <button
                    type="button"
                    className="delete-button"
                    onClick={handleDeleteEvent}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                )}

                <button type="submit" className="save-button">
                  {modalMode === 'add' ? 'Add Event' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
