const Event = require('../models/Event');
const User = require('../models/User');

// @desc    Get all events with search and filters
// @route   GET /api/events
// @access  Private
exports.getAll = async (req, res) => {
  try {
    const { search, category, sort } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'all') {
      query.category = category.toLowerCase();
    }

    let sortBy = { date: 1 }; // Default: upcoming first
    if (sort === 'newest') {
      sortBy = { createdAt: -1 };
    }

    const events = await Event.find(query)
      .populate('organizer', 'name email profileImage')
      .sort(sortBy);

    res.json({ success: true, count: events.length, events });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Private
exports.getById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email profileImage')
      .populate('registeredUsers', 'name email profileImage university');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({ success: true, event });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private
exports.create = async (req, res) => {
  try {
    const { title, description, category, date, venue, maxAttendees, tags } = req.body;

    if (!title || !description || !category || !date || !venue) {
      return res.status(400).json({ success: false, message: 'Please add all required fields' });
    }

    let imagePath = '';
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    const tagsArray = tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [];

    const event = await Event.create({
      title,
      description,
      category: category.toLowerCase(),
      date,
      venue,
      maxAttendees: maxAttendees || 100,
      tags: tagsArray,
      image: imagePath,
      organizer: req.user.id,
      university: req.user.university || ''
    });

    res.status(201).json({ success: true, event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Register / Deregister for event
// @route   POST /api/events/:id/register
// @access  Private
exports.register = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const isRegistered = event.registeredUsers.includes(req.user.id);

    if (isRegistered) {
      // Deregister
      event.registeredUsers = event.registeredUsers.filter(
        id => id.toString() !== req.user.id
      );
      await event.save();
      res.json({ success: true, message: 'Deregistered from event', isRegistered: false, event });
    } else {
      // Register
      if (event.registeredUsers.length >= event.maxAttendees) {
        return res.status(400).json({ success: false, message: 'Event is already full' });
      }

      event.registeredUsers.push(req.user.id);
      await event.save();
      res.json({ success: true, message: 'Registered for event successfully', isRegistered: true, event });
    }
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Save / Unsave event (Bookmark)
// @route   POST /api/events/:id/save
// @access  Private
exports.saveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const user = await User.findById(req.user.id);
    const isSaved = user.savedEvents.includes(event._id);

    if (isSaved) {
      // Unsave
      user.savedEvents = user.savedEvents.filter(
        id => id.toString() !== event._id.toString()
      );
      await user.save({ validateBeforeSave: false });

      event.savedBy = event.savedBy.filter(
        id => id.toString() !== req.user.id
      );
      await event.save();

      res.json({ success: true, message: 'Event unsaved', isSaved: false });
    } else {
      // Save
      user.savedEvents.push(event._id);
      await user.save({ validateBeforeSave: false });

      event.savedBy.push(req.user.id);
      await event.save();

      res.json({ success: true, message: 'Event saved', isSaved: true });
    }
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
