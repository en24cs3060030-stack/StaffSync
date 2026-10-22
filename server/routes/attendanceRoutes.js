const router = require('express').Router();
const c = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validateId = require('../middleware/validateObjectId');

router.use(protect);
router.get('/today', c.getToday);
router.get('/my', c.getMine);
router.post('/check-in', c.checkIn);
router.post('/check-out', c.checkOut);
router.get('/', authorize('hr'), c.getAll);
router.post('/manual', authorize('hr'), c.manualMark);
router.delete('/:id', authorize('hr'), validateId(), c.remove);

module.exports = router;
