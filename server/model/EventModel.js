const mongoose = require('mongoose');

const attendeeSchema = mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    name: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending'
    }
});

const eventSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    start: {
        type: Date,
        required: true
    },
    end: {
        type: Date,
        required: true
    },
    location: {
        type: String
    },
    attendees: [attendeeSchema],
    calendarId: {
        type: String
    },
    color: {
        type: String,
        default: '#A67C52' // Default to the app's primary color
    },
    isAllDay: {
        type: Boolean,
        default: false
    },
    recurrence: {
        type: String // iCal RRule format
    },
    reminders: [{
        type: Number, // Minutes before event
        default: 30
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Create indexes for faster queries
eventSchema.index({ userId: 1, start: 1 });
eventSchema.index({ userId: 1, end: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
