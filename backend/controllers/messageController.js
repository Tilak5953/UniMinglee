const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get conversation history between current user and another user
// @route   GET /api/messages/:userId
// @access  Private
exports.getConversation = async (req, res) => {
  try {
    const chatUserId = req.params.userId;
    const currentUserId = req.user.id;

    // Fetch messages between current user and chatUserId
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: chatUserId },
        { sender: chatUserId, receiver: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    // Mark incoming messages as read
    await Message.updateMany(
      { sender: chatUserId, receiver: currentUserId, read: false },
      { $set: { read: true } }
    );

    res.json({ success: true, count: messages.length, messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { receiver, content } = req.body;

    if (!receiver || !content) {
      return res.status(400).json({ success: false, message: 'Please provide receiver and content' });
    }

    // Check if receiver exists
    const recipient = await User.findById(receiver);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    const message = await Message.create({
      sender: req.user.id,
      receiver,
      content
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get list of conversations
// @route   GET /api/messages/conversations/list
// @access  Private
exports.getConversationList = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Aggregates conversations
    // Find all messages involving current user
    const messages = await Message.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }]
    }).sort({ createdAt: -1 });

    const conversationsMap = {};

    for (const msg of messages) {
      const otherUserId = msg.sender.toString() === currentUserId ? msg.receiver.toString() : msg.sender.toString();

      if (!conversationsMap[otherUserId]) {
        // Fetch User details for user list
        const otherUser = await User.findById(otherUserId).select('name email profileImage isOnline lastSeen');
        if (otherUser) {
          // Count unread
          const unreadCount = await Message.countDocuments({
            sender: otherUserId,
            receiver: currentUserId,
            read: false
          });

          conversationsMap[otherUserId] = {
            user: otherUser,
            lastMessage: msg.content,
            lastMessageTime: msg.createdAt,
            unreadCount
          };
        }
      }
    }

    const conversationList = Object.values(conversationsMap).sort(
      (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );

    res.json({ success: true, count: conversationList.length, conversations: conversationList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
