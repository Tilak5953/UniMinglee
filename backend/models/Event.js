const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add an event title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  category: {
    type: String,
    enum: ['technical', 'cultural', 'sports', 'workshops', 'hackathons'],
    required: [true, 'Please add a category']
  },
  date: {
    type: Date,
    required: [true, 'Please add a date']
  },
  venue: {
    type: String,
    required: [true, 'Please add a venue']
  },
  image: {
    type: String,
    default: ''
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registeredUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  university: {
    type: String,
    default: ''
  },
  tags: {
    type: [String],
    default: []
  },
  maxAttendees: {
    type: Number,
    default: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', EventSchema);
