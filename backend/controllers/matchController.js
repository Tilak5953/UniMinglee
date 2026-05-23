const User = require('../models/User');
const Match = require('../models/Match');

// @desc    Get recommended students based on interests, branch, personality
// @route   GET /api/matches/suggestions
// @access  Private
exports.getSuggestions = async (req, res) => {
  try {
    const currentUser = req.user;

    // 1. Get existing matches / requests involving the current user to exclude them
    const existingMatches = await Match.find({
      $or: [{ user1: currentUser.id }, { user2: currentUser.id }]
    });

    const excludedUserIds = [currentUser.id];
    existingMatches.forEach(match => {
      excludedUserIds.push(match.user1.toString());
      excludedUserIds.push(match.user2.toString());
    });

    // Remove duplicates
    const uniqueExcludedIds = [...new Set(excludedUserIds)];

    // 2. Fetch potential match candidates (exclude self, existing matches, and match requests)
    const candidates = await User.find({
      _id: { $nin: uniqueExcludedIds }
    });

    const suggestions = [];

    // 3. Score compatibility for each candidate
    candidates.forEach(candidate => {
      let score = 0;
      const sharedInterests = [];

      // Interest Match (35 points max, 7 points per interest)
      currentUser.interests.forEach(interest => {
        if (candidate.interests.some(ci => ci.toLowerCase() === interest.toLowerCase())) {
          score += 8;
          sharedInterests.push(interest);
        }
      });

      // Branch Match (15 points)
      if (currentUser.branch && candidate.branch && currentUser.branch.toLowerCase() === candidate.branch.toLowerCase()) {
        score += 15;
      }

      // University Match (20 points)
      if (currentUser.university && candidate.university && currentUser.university.toLowerCase() === candidate.university.toLowerCase()) {
        score += 20;
      }

      // Personality Type Match (30 points)
      // Introverts match best with other introverts or ambiverts
      if (currentUser.personalityType === 'introvert') {
        if (candidate.personalityType === 'introvert') score += 30;
        else if (candidate.personalityType === 'ambivert') score += 20;
        else score += 10;
      } else if (currentUser.personalityType === 'ambivert') {
        if (candidate.personalityType === 'ambivert') score += 30;
        else if (candidate.personalityType === 'introvert') score += 25;
        else score += 25;
      } else { // Extrovert
        if (candidate.personalityType === 'ambivert') score += 30;
        else if (candidate.personalityType === 'extrovert') score += 20;
        else score += 10;
      }

      // Cap compatibility score at 100
      const finalScore = Math.min(score, 100);

      // Only recommend if they share something or have at least 25% compatibility
      if (finalScore >= 25 || sharedInterests.length > 0) {
        suggestions.push({
          user: {
            _id: candidate._id,
            name: candidate.name,
            university: candidate.university,
            branch: candidate.branch,
            year: candidate.year,
            bio: candidate.bio,
            personalityType: candidate.personalityType,
            profileImage: candidate.profileImage,
            interests: candidate.interests,
            skills: candidate.skills
          },
          compatibilityScore: finalScore,
          sharedInterests
        });
      }
    });

    // Sort suggestions by compatibility score descending
    suggestions.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    res.json({ success: true, count: suggestions.length, suggestions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Send a match request
// @route   POST /api/matches/:userId/request
// @access  Private
exports.sendRequest = async (req, res) => {
  try {
    const receiverId = req.params.userId;
    const senderId = req.user.id;

    if (receiverId === senderId) {
      return res.status(400).json({ success: false, message: 'Cannot match with yourself' });
    }

    // Check if match already exists
    const matchExists = await Match.findOne({
      $or: [
        { user1: senderId, user2: receiverId },
        { user1: receiverId, user2: senderId }
      ]
    });

    if (matchExists) {
      return res.status(400).json({ success: false, message: 'Match request already exists or you are already connected' });
    }

    // Retrieve users to calculate compatibility
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Calculate score
    let score = 0;
    const sharedInterests = [];
    sender.interests.forEach(interest => {
      if (receiver.interests.some(ci => ci.toLowerCase() === interest.toLowerCase())) {
        score += 8;
        sharedInterests.push(interest);
      }
    });
    if (sender.branch && receiver.branch && sender.branch.toLowerCase() === receiver.branch.toLowerCase()) {
      score += 15;
    }
    if (sender.university && receiver.university && sender.university.toLowerCase() === receiver.university.toLowerCase()) {
      score += 20;
    }
    const finalScore = Math.min(score + 30, 100); // Standard personality base

    const newMatch = await Match.create({
      user1: senderId, // Initiator
      user2: receiverId,
      compatibilityScore: finalScore,
      sharedInterests,
      status: 'pending'
    });

    res.status(201).json({ success: true, message: 'Match request sent successfully', match: newMatch });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Accept or reject a match request
// @route   PUT /api/matches/:matchId
// @access  Private
exports.respondToMatch = async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status response' });
    }

    const match = await Match.findById(req.params.matchId);

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match request not found' });
    }

    // Ensure only receiver of request can accept/reject
    if (match.user2.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to respond to this request' });
    }

    match.status = status;
    await match.save();

    res.json({ success: true, message: `Match request ${status} successfully`, match });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Match request not found' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get user matches (Accepted connections)
// @route   GET /api/matches
// @access  Private
exports.getMyMatches = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const status = req.query.status || 'accepted';

    let query = {};
    if (status === 'pending') {
      // Incoming pending requests only
      query = { user2: currentUserId, status: 'pending' };
    } else {
      // Either user1 or user2, must be accepted/rejected as requested
      query = {
        $or: [{ user1: currentUserId }, { user2: currentUserId }],
        status: status
      };
    }

    const matches = await Match.find(query)
      .populate('user1', 'name email university branch year profileImage personalityType interests')
      .populate('user2', 'name email university branch year profileImage personalityType interests');

    // Filter connections list to extract other user info
    const connections = matches.map(match => {
      const isUser1 = match.user1._id.toString() === currentUserId;
      const otherUser = isUser1 ? match.user2 : match.user1;
      return {
        matchId: match._id,
        user: otherUser,
        compatibilityScore: match.compatibilityScore,
        sharedInterests: match.sharedInterests,
        status: match.status,
        createdAt: match.createdAt
      };
    });

    res.json({ success: true, count: connections.length, connections });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
