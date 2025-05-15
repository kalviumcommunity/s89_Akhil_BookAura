import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

// Create the context
const ScheduleContext = createContext();

// Custom hook to use the schedule context
export const useSchedule = () => useContext(ScheduleContext);

// Provider component
export const ScheduleProvider = ({ children }) => {
  // State for schedules
  const [schedules, setSchedules] = useState([
    {
      id: 1,
      title: "Book Club Meeting",
      date: new Date(new Date().setDate(new Date().getDate() + 1)),
      time: "10:00 AM - 11:30 AM",
      description: "Discussion on 'The Great Gatsby' - Chapter 5"
    },
    {
      id: 2,
      title: "Reading Session",
      date: new Date(new Date().setDate(new Date().getDate() + 2)),
      time: "2:00 PM - 4:00 PM",
      description: "Focus on completing 'To Kill a Mockingbird'"
    },
    {
      id: 3,
      title: "Study Group",
      date: new Date(new Date().setDate(new Date().getDate() + 4)),
      time: "3:30 PM - 5:00 PM",
      description: "Modern Literature Discussion Group"
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch schedules from the server
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is logged in
      const token = document.cookie.includes('token=');

      if (token) {
        // Get the start and end of the current month for filtering
        const start = moment().startOf('month').format();
        const end = moment().endOf('month').format();

        const response = await axios.get('https://s89-akhil-bookaura-2.onrender.com/api/events', {
          params: { start, end },
          withCredentials: true
        });

        if (response.data.success) {
          // Transform the events to the format expected by our app
          const formattedEvents = response.data.data.map(event => ({
            id: event._id,
            title: event.title,
            date: new Date(event.start),
            time: `${moment(event.start).format('h:mm A')} - ${moment(event.end).format('h:mm A')}`,
            description: event.description || 'No description provided'
          }));

          setSchedules(formattedEvents);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError('Failed to load schedules. Please try again later.');
      setLoading(false);
    }
  };

  // Function to add a new schedule
  const addSchedule = async (newSchedule) => {
    try {
      setLoading(true);

      // Check if user is logged in
      const token = document.cookie.includes('token=');

      if (token) {
        // Format the schedule for the API
        const startTime = moment(`${moment(newSchedule.date).format('YYYY-MM-DD')} ${newSchedule.time.split(' - ')[0]}`, 'YYYY-MM-DD h:mm A');
        const endTime = moment(`${moment(newSchedule.date).format('YYYY-MM-DD')} ${newSchedule.time.split(' - ')[1]}`, 'YYYY-MM-DD h:mm A');

        const scheduleData = {
          title: newSchedule.title,
          description: newSchedule.description,
          start: startTime.toDate(),
          end: endTime.toDate(),
          calendarId: 'mongodb_calendar',
          color: '#A67C52'
        };

        const response = await axios.post('https://s89-akhil-bookaura-2.onrender.com/api/events', scheduleData, {
          withCredentials: true
        });

        if (response.data.success) {
          // Add the new schedule to the state
          const savedSchedule = response.data.data;
          const formattedSchedule = {
            id: savedSchedule._id,
            title: savedSchedule.title,
            date: new Date(savedSchedule.start),
            time: `${moment(savedSchedule.start).format('h:mm A')} - ${moment(savedSchedule.end).format('h:mm A')}`,
            description: savedSchedule.description || 'No description provided'
          };

          setSchedules([...schedules, formattedSchedule]);
        }
      } else {
        // For demo mode, just add to local state
        const newId = Math.max(...schedules.map(s => s.id), 0) + 1;
        const scheduleToAdd = {
          ...newSchedule,
          id: newId
        };

        setSchedules([...schedules, scheduleToAdd]);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error adding schedule:', err);
      setError('Failed to add schedule. Please try again later.');
      setLoading(false);
    }
  };

  // Function to delete a schedule
  const deleteSchedule = async (id) => {
    try {
      setLoading(true);

      // Check if user is logged in
      const token = document.cookie.includes('token=');

      if (token) {
        const response = await axios.delete(`https://s89-akhil-bookaura-2.onrender.com/api/events/${id}`, {
          withCredentials: true
        });

        if (response.data.success) {
          // Remove the schedule from the state
          setSchedules(schedules.filter(schedule => schedule.id !== id));
        }
      } else {
        // For demo mode, just remove from local state
        setSchedules(schedules.filter(schedule => schedule.id !== id));
      }

      setLoading(false);
    } catch (err) {
      console.error('Error deleting schedule:', err);
      setError('Failed to delete schedule. Please try again later.');
      setLoading(false);
    }
  };

  // Fetch schedules on component mount
  useEffect(() => {
    fetchSchedules();
  }, []);

  // Value to be provided to consumers
  const value = {
    schedules,
    loading,
    error,
    fetchSchedules,
    addSchedule,
    deleteSchedule
  };

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
};
