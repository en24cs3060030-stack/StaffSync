const router = require('express').Router();
const c = require('../controllers/teamController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validateId = require('../middleware/validateObjectId');

router.use(protect, authorize('manager'));
router.get('/', c.getTeamMembers);
router.get('/attendance', c.getTeamAttendance);
router.get('/unassigned', c.getUnassigned);
router.post('/members', c.addMember);
router.delete('/members/:id', validateId(), c.removeMember);
router.get('/:id', validateId(), c.getMember);
router.post('/:id/performance', validateId(), c.addPerformance);

module.exports = router;
