const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { getMyNotifications, markRead, markAllRead } = require('../controllers/notificationController');

router.get('/',                protect, getMyNotifications);
router.put('/mark-all',        protect, markAllRead);
router.put('/:id/read',        protect, markRead);

module.exports = router;
