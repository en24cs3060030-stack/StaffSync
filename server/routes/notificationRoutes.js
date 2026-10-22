const router = require('express').Router();
const c = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const validateId = require('../middleware/validateObjectId');

router.use(protect);
router.get('/', c.getNotifications);
router.get('/unread-count', c.unreadCount);
router.put('/read-all', c.markAllRead);
router.put('/:id/read', validateId(), c.markRead);
router.delete('/:id', validateId(), c.remove);

module.exports = router;
