const express = require('express');
const router = express.Router();
const { getSuggestions, sendRequest, respondToMatch, getMyMatches } = require('../controllers/matchController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getMyMatches);
router.get('/suggestions', protect, getSuggestions);
router.post('/:userId/request', protect, sendRequest);
router.put('/:matchId', protect, respondToMatch);

module.exports = router;
