const Notification = require('../models/Notification');

// ─── Create Notification (Service-to-Service) ───
exports.createNotification = async (req, res, next) => {
  try {
    const { userId, type, title, message, metadata } = req.body;
    if (!userId || !type || !title || !message) {
      return res.status(400).json({ success: false, message: 'userId, type, title, and message are required.' });
    }

    const notification = await Notification.create({ userId, type, title, message, metadata });
    res.status(201).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

// ─── Get My Notifications ───
exports.getMyNotifications = async (req, res, next) => {
  try {
    const { isRead, page = 1, limit = 20 } = req.query;
    const filter = { userId: req.user.id };
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    const skip = (Number(page) - 1) * Number(limit);
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId: req.user.id, isRead: false })
    ]);

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Mark Notification as Read ───
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

// ─── Mark All as Read ───
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Notification ───
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });

    if (notification.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    next(error);
  }
};

// ─── Get Notifications by User (Service-to-Service) ───
exports.getNotificationsByUser = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
};
