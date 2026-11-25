const Notification = require('../models/Notification');

/**
 * @desc    Get notifications for the logged in user
 * @route   GET /api/notifications
 * @access  Private
 */
const getMyNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;

    const query = { user: req.user._id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 20;
    const skip = (parsedPage - 1) * parsedLimit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate('report', 'complaintId address status priority')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
      Notification.countDocuments(query),
      Notification.countDocuments({ user: req.user._id, isRead: false })
    ]);

    res.status(200).json({
      success: true,
      unreadCount,
      total,
      page: parsedPage,
      pages: Math.ceil(total / parsedLimit),
      data: notifications
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Mark a notification as read (or all as read if id = 'read-all')
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === 'read-all') {
      await Notification.updateMany(
        { user: req.user._id, isRead: false },
        { $set: { isRead: true } }
      );

      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read'
      });
    }

    const notification = await Notification.findOne({
      _id: id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead
};

