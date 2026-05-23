const express = require('express');
const router = express.Router();
const { getConversation, sendMessage, getConversationList } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.get('/conversations/list', protect, getConversationList);
router.get('/:userId', protect, getConversation);
router.post('/', protect, sendMessage);

module.exports = router;
