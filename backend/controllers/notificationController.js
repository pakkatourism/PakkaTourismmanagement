const Notification = require('../models/Notification');

// ─── GET /api/notifications ──────────────────────────────────────────────────
const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false });
    res.json({ success: true, unreadCount, data: notifications });
  } catch (err) { next(err); }
};

// ─── PUT /api/notifications/:id/read ────────────────────────────────────────
const markRead = async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true, readAt: new Date() },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, data: notif });
  } catch (err) { next(err); }
};

// ─── PUT /api/notifications/mark-all ────────────────────────────────────────
const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) { next(err); }
};

module.exports = { getMyNotifications, markRead, markAllRead };
