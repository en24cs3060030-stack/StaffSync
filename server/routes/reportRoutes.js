const router = require('express').Router();
const { getAnalytics } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/analytics', protect, authorize('hr'), getAnalytics);

module.exports = router;
