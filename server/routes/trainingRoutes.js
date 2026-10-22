const router = require('express').Router();
const c = require('../controllers/trainingController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validateId = require('../middleware/validateObjectId');

router.use(protect);
router.get('/', c.getTrainings);
router.post('/', authorize('hr', 'manager'), c.createTraining);
router.get('/:id', authorize('hr', 'manager'), validateId(), c.getTraining);
router.put('/:id', authorize('hr', 'manager'), validateId(), c.updateTraining);
router.delete('/:id', authorize('hr', 'manager'), validateId(), c.deleteTraining);
router.post('/:id/enroll', validateId(), c.enroll);
router.post('/:id/unenroll', validateId(), c.unenroll);
router.post('/:id/assign', authorize('hr', 'manager'), validateId(), c.assign);

module.exports = router;
