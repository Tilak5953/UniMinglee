const express = require('express');
const router = express.Router();
const { getAll, getById, create, register, saveEvent } = require('../controllers/eventController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/')
  .get(protect, getAll)
  .post(protect, upload.single('image'), create);

router.route('/:id')
  .get(protect, getById);

router.post('/:id/register', protect, register);
router.post('/:id/save', protect, saveEvent);

module.exports = router;
