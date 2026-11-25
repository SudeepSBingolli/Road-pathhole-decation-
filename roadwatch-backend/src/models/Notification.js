const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true
    },
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      default: null,
      index: true
    },
    type: {
      type: String,
      enum: [
        'report:new',
        'report:statusChanged',
        'task:assigned',
        'repair:submitted',
        'repair:verified',
        'report:overdue',
        'general'
      ],
      default: 'general'
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

