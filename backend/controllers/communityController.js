const Community = require('../models/Community');
const User = require('../models/User');

// @desc    Get all communities with search and filter
// @route   GET /api/communities
// @access  Private
exports.getAll = async (req, res) => {
  try {
    const { search, category } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'all') {
      query.category = category.toLowerCase();
    }

    const communities = await Community.find(query).populate('admin', 'name email');
    res.json({ success: true, count: communities.length, communities });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get single community by ID
// @route   GET /api/communities/:id
// @access  Private
exports.getById = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('admin', 'name email profileImage')
      .populate('members', 'name email university profileImage personalityType');

    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    res.json({ success: true, community });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create new community
// @route   POST /api/communities
// @access  Private
exports.create = async (req, res) => {
  try {
    const { name, description, category, icon, tags } = req.body;

    if (!name || !description || !category) {
      return res.status(400).json({ success: false, message: 'Please add all required fields' });
    }

    // Check if community exists
    const exists = await Community.findOne({ name });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Community name already exists' });
    }

    const tagsArray = tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [];

    const community = await Community.create({
      name,
      description,
      category: category.toLowerCase(),
      icon: icon || '🎯',
      admin: req.user.id,
      members: [req.user.id],
      tags: tagsArray,
      university: req.user.university || ''
    });

    // Add to user's communities
    await User.findByIdAndUpdate(req.user.id, {
      $push: { communities: community._id }
    });

    res.status(201).json({ success: true, community });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Join community
// @route   POST /api/communities/:id/join
// @access  Private
exports.join = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    // Check if already member
    if (community.members.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: 'Already a member of this community' });
    }

    // Add member
    community.members.push(req.user.id);
    await community.save();

    // Add to user's communities
    await User.findByIdAndUpdate(req.user.id, {
      $push: { communities: community._id }
    });

    res.json({ success: true, message: 'Joined community successfully', community });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Leave community
// @route   POST /api/communities/:id/leave
// @access  Private
exports.leave = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    // Check if member
    if (!community.members.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: 'Not a member of this community' });
    }

    // Check if admin (cannot leave unless delete/assign someone else)
    if (community.admin.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Admin cannot leave community. Delete the community instead'
      });
    }

    // Remove member
    community.members = community.members.filter(
      m => m.toString() !== req.user.id
    );
    await community.save();

    // Remove from user's communities
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { communities: community._id }
    });

    res.json({ success: true, message: 'Left community successfully', community });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
