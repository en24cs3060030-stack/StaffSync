const router = require('express').Router();
const { getProfile, updateProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getProfile);
router.put('/', updateProfile);

module.exports = router;
