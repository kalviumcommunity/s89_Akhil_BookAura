const express = require('express');
const router = express.Router();
const { loadModel } = require('../utils/modelLoader');
const Event = loadModel('EventModel');
const { verifyToken } = require('../middleware/auth');

// Load environment variables using our centralized utility
require('../utils/envConfig');

// Get all events for the authenticated user
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { start, end } = req.query;

        console.log('Fetching events for user:', userId);
        console.log('Date range:', start, 'to', end);

        // Build query based on date range if provided
        const query = { userId };
        if (start && end) {
            query.$or = [
                { start: { $gte: new Date(start), $lte: new Date(end) } },
                { end: { $gte: new Date(start), $lte: new Date(end) } },
                {
                    start: { $lte: new Date(start) },
                    end: { $gte: new Date(end) }
                }
            ];
        }

        console.log('MongoDB query:', JSON.stringify(query));

        const events = await Event.find(query).sort({ start: 1 });
        console.log('Found events:', events.length);

        res.status(200).json({
            success: true,
            message: 'Events fetched successfully',
            data: events
        });
    } catch (error) {
        console.error('Error fetching events:', error);

        // Check for authentication errors
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Authentication failed. Please log in again.',
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error fetching events',
            error: error.message
        });
    }
});

// Get a specific event by ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const eventId = req.params.id;

        const event = await Event.findOne({ _id: eventId, userId });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Event fetched successfully',
            data: event
        });
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching event',
            error: error.message
        });
    }
});

// Create a new event
router.post('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            title,
            description,
            start,
            end,
            location,
            attendees,
            calendarId,
            color,
            isAllDay,
            recurrence,
            reminders
        } = req.body;

        console.log('Creating new event for user:', userId);
        console.log('Event data received:', {
            title,
            start: start ? new Date(start).toISOString() : null,
            end: end ? new Date(end).toISOString() : null,
            calendarId
        });

        // Validate required fields
        if (!title || !start || !end) {
            console.log('Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Title, start, and end are required fields'
            });
        }

        // Create new event
        const newEvent = new Event({
            userId,
            title,
            description,
            start: new Date(start),
            end: new Date(end),
            location,
            attendees: attendees || [],
            calendarId,
            color,
            isAllDay: isAllDay || false,
            recurrence,
            reminders: reminders || [30] // Default 30 minutes before
        });

        console.log('Saving event to database...');
        await newEvent.save();
        console.log('Event saved successfully with ID:', newEvent._id);

        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            data: newEvent
        });
    } catch (error) {
        console.error('Error creating event:', error);

        // Check for specific error types
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating event',
            error: error.message
        });
    }
});

// Update an existing event
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const eventId = req.params.id;
        const updateData = req.body;

        // Convert date strings to Date objects
        if (updateData.start) {
            updateData.start = new Date(updateData.start);
        }
        if (updateData.end) {
            updateData.end = new Date(updateData.end);
        }

        // Update the event
        const updatedEvent = await Event.findOneAndUpdate(
            { _id: eventId, userId },
            { $set: updateData },
            { new: true }
        );

        if (!updatedEvent) {
            return res.status(404).json({
                success: false,
                message: 'Event not found or you do not have permission to update it'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Event updated successfully',
            data: updatedEvent
        });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating event',
            error: error.message
        });
    }
});

// Delete an event
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const eventId = req.params.id;

        console.log('Deleting event for user:', userId, 'Event ID:', eventId);

        const deletedEvent = await Event.findOneAndDelete({ _id: eventId, userId });

        if (!deletedEvent) {
            console.log('Event not found or user does not have permission');
            return res.status(404).json({
                success: false,
                message: 'Event not found or you do not have permission to delete it'
            });
        }

        console.log('Event deleted successfully:', deletedEvent._id);

        res.status(200).json({
            success: true,
            message: 'Event deleted successfully',
            data: deletedEvent
        });
    } catch (error) {
        console.error('Error deleting event:', error);

        // Check for specific error types
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID format',
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error deleting event',
            error: error.message
        });
    }
});

module.exports = router;
