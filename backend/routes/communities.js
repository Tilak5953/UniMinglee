const express = require('express');
const router = express.Router();
const { getAll, getById, create, join, leave } = require('../controllers/communityController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getAll)
  .post(protect, create);

router.route('/:id')
  .get(protect, getById);

router.post('/:id/join', protect, join);
router.post('/:id/leave', protect, leave);

module.exports = router;
