const User = require('../models/User');
const Community = require('../models/Community');
const Event = require('../models/Event');
const Message = require('../models/Message');
const Match = require('../models/Match');
const path = require('path');
const fs = require('fs');

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/me
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, university, branch, year, personalityType, interests, skills } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (bio !== undefined) fieldsToUpdate.bio = bio;
    if (university !== undefined) fieldsToUpdate.university = university;
    if (branch !== undefined) fieldsToUpdate.branch = branch;
    if (year !== undefined) fieldsToUpdate.year = year;
    if (personalityType) fieldsToUpdate.personalityType = personalityType;
    if (interests) fieldsToUpdate.interests = Array.isArray(interests) ? interests : JSON.parse(interests);
    if (skills) fieldsToUpdate.skills = Array.isArray(skills) ? skills : JSON.parse(skills);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Upload profile avatar image
// @route   POST /api/users/me/avatar
// @access  Private
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    const imagePath = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: imagePath },
      { new: true }
    );

    res.json({ success: true, profileImage: imagePath, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete user account completely
// @route   DELETE /api/users/me
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Remove from all communities' member lists
    await Community.updateMany(
      { members: userId },
      { $pull: { members: userId } }
    );

    // 2. If user is admin of communities, assign another admin or delete community?
    // For simplicity, delete communities where user is admin
    await Community.deleteMany({ admin: userId });

    // 3. Remove from event registrations / saved events
    await Event.updateMany(
      { registeredUsers: userId },
      { $pull: { registeredUsers: userId } }
    );
    await Event.updateMany(
      { savedBy: userId },
      { $pull: { savedBy: userId } }
    );

    // 4. Delete events organized by this user
    await Event.deleteMany({ organizer: userId });

    // 5. Delete all chats/messages sent/received by this user
    await Message.deleteMany({
      $or: [{ sender: userId }, { receiver: userId }]
    });

    // 6. Delete all matches for this user
    await Match.deleteMany({
      $or: [{ user1: userId }, { user2: userId }]
    });

    // 7. Delete the user file upload physically if it exists and is local
    const user = await User.findById(userId);
    if (user && user.profileImage && user.profileImage.startsWith('/uploads/')) {
      const fullPath = path.join(__dirname, '..', user.profileImage);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    // 8. Delete user document
    await User.findByIdAndDelete(userId);

    res.json({ success: true, message: 'Account successfully deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all users with search/filter
// @route   GET /api/users
// @access  Private
exports.getAllUsers = async (req, res) => {
  try {
    const { search, university, interest } = req.query;

    const query = { _id: { $ne: req.user.id } }; // Exclude self

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { university: { $regex: search, $options: 'i' } },
        { branch: { $regex: search, $options: 'i' } }
      ];
    }

    if (university) {
      query.university = { $regex: university, $options: 'i' };
    }

    if (interest) {
      query.interests = { $in: [new RegExp(interest, 'i')] };
    }

    const users = await User.find(query).select('-password');
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
