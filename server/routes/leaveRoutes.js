const router = require('express').Router();
const c = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validateId = require('../middleware/validateObjectId');

router.use(protect);
router.post('/', c.apply);
router.get('/my', c.getMine);
router.get('/balance', c.getBalance);
router.get('/', authorize('hr', 'manager'), c.getRequests);
router.put('/:id/cancel', validateId(), c.cancel);
router.put('/:id/review', authorize('hr', 'manager'), validateId(), c.review);

module.exports = router;
