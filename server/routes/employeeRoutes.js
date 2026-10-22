const router = require('express').Router();
const c = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validateId = require('../middleware/validateObjectId');

// HR manages employees (managers can also read the employee list to build teams)
router.use(protect);
router.get('/all', authorize('hr', 'manager'), c.options);
router.get('/', authorize('hr'), c.list);
router.post('/', authorize('hr'), c.create);
router.get('/:id', authorize('hr'), validateId(), c.getOne);
router.put('/:id', authorize('hr'), validateId(), c.update);
router.delete('/:id', authorize('hr'), validateId(), c.remove);

module.exports = router;
