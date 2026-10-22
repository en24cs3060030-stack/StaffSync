const router = require('express').Router();
const c = require('../controllers/announcementController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validateId = require('../middleware/validateObjectId');

router.use(protect);
router.get('/', c.getAnnouncements);
router.post('/', authorize('hr'), c.createAnnouncement);
router.put('/:id', authorize('hr'), validateId(), c.updateAnnouncement);
router.delete('/:id', authorize('hr'), validateId(), c.deleteAnnouncement);

module.exports = router;
