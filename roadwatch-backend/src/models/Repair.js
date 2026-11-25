const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const repairSchema = new mongoose.Schema(
  {
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: [true, 'Report reference is required'],
      index: true
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: [true, 'Team reference is required'],
      index: true
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'SubmittedBy user reference is required'],
      index: true
    },
    beforeImages: {
      type: [imageSchema],
      default: []
    },
    afterImages: {
      type: [imageSchema],
      default: []
    },
    notes: {
      type: String,
      default: '',
      trim: true
    },
    materialsUsed: {
      type: [String],
      default: []
    },
    timeTakenHours: {
      type: Number,
      required: [true, 'Time taken in hours is required'],
      min: [0.1, 'Time taken must be at least 0.1 hours']
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    verification: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true
      },
      by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      remarks: {
        type: String,
        default: ''
      },
      at: {
        type: Date,
        default: null
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes
repairSchema.index({ report: 1, createdAt: -1 });
repairSchema.index({ team: 1, 'verification.status': 1 });

module.exports = mongoose.model('Repair', repairSchema);

