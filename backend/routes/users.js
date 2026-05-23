const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, uploadProfileImage, deleteAccount, getAllUsers } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, getAllUsers);
router.get('/:id', protect, getProfile);
router.put('/me', protect, updateProfile);
router.post('/me/avatar', protect, upload.single('avatar'), uploadProfileImage);
router.delete('/me', protect, deleteAccount);

module.exports = router;
