import axios from 'axios';

// Cronofy API endpoints
const CRONOFY_BASE_URL = 'https://api.cronofy.com';
const REDIRECT_URI = 'http://localhost:5173/calendar/callback';

class CronofyService {
  constructor() {
    // Use environment variables if available, otherwise use placeholders
    // You'll need to replace these with your actual Cronofy credentials
    this.clientId = import.meta.env.VITE_CRONOFY_CLIENT_ID || 'your_cronofy_client_id';
    this.clientSecret = import.meta.env.VITE_CRONOFY_CLIENT_SECRET || 'your_cronofy_client_secret';
    this.accessToken = localStorage.getItem('cronofyAccessToken');
    this.refreshToken = localStorage.getItem('cronofyRefreshToken');
  }

  // Get authorization URL for OAuth flow
  getAuthorizationUrl() {
    const scope = 'read_events create_event delete_event';
    return `${CRONOFY_BASE_URL}/oauth/authorize?response_type=code&client_id=${this.clientId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}`;
  }

  // Exchange authorization code for tokens
  async getTokens(code) {
    try {
      const response = await axios.post(`${CRONOFY_BASE_URL}/oauth/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;

      // Store tokens in localStorage
      localStorage.setItem('cronofyAccessToken', this.accessToken);
      localStorage.setItem('cronofyRefreshToken', this.refreshToken);

      return response.data;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw error;
    }
  }

  // Refresh access token
  async refreshAccessToken() {
    try {
      const response = await axios.post(`${CRONOFY_BASE_URL}/oauth/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;

      // Update tokens in localStorage
      localStorage.setItem('cronofyAccessToken', this.accessToken);
      localStorage.setItem('cronofyRefreshToken', this.refreshToken);

      return response.data;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  // Get user's calendars
  async getCalendars() {
    try {
      const response = await axios.get(`${CRONOFY_BASE_URL}/v1/calendars`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      });
      return response.data.calendars;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        await this.refreshAccessToken();
        return this.getCalendars();
      }
      console.error('Error getting calendars:', error);
      throw error;
    }
  }

  // Create a new event
  async createEvent(calendarId, event) {
    try {
      const response = await axios.post(`${CRONOFY_BASE_URL}/v1/calendars/${calendarId}/events`, {
        event
      }, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        await this.refreshAccessToken();
        return this.createEvent(calendarId, event);
      }
      console.error('Error creating event:', error);
      throw error;
    }
  }

  // Get available time slots for scheduling
  async getAvailability(participants, timeWindow) {
    try {
      const response = await axios.post(`${CRONOFY_BASE_URL}/v1/availability`, {
        participants,
        required_duration: { minutes: 60 },
        available_periods: [
          {
            start: timeWindow.start,
            end: timeWindow.end
          }
        ]
      }, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      });
      return response.data.available_periods;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        await this.refreshAccessToken();
        return this.getAvailability(participants, timeWindow);
      }
      console.error('Error getting availability:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.accessToken;
  }

  // Logout user
  logout() {
    localStorage.removeItem('cronofyAccessToken');
    localStorage.removeItem('cronofyRefreshToken');
    this.accessToken = null;
    this.refreshToken = null;
  }
}

export default new CronofyService();
