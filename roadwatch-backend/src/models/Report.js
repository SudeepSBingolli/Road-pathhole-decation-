const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: [
        'submitted',
        'under-review',
        'assigned',
        'in-progress',
        'repair-completed',
        'verified',
        'rejected',
        'duplicate'
      ]
    },
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    note: {
      type: String,
      default: ''
    },
    at: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

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

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true
    },
    // Coordinates format: [longitude, latitude]
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function (val) {
          return (
            Array.isArray(val) &&
            val.length === 2 &&
            val[0] >= -180 &&
            val[0] <= 180 && // longitude
            val[1] >= -90 &&
            val[1] <= 90 // latitude
          );
        },
        message: 'Coordinates must be valid [longitude, latitude]'
      }
    }
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Citizen reference is required'],
      index: true
    },
    images: {
      type: [imageSchema],
      validate: {
        validator: function (val) {
          return val.length <= 3;
        },
        message: 'A report cannot exceed 3 images'
      },
      default: []
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    location: {
      type: pointSchema,
      required: true
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    area: {
      type: String,
      required: [true, 'Area is required'],
      trim: true,
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
      index: true
    },
    complaintCount: {
      type: Number,
      default: 1,
      min: 1
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: [
        'submitted',
        'under-review',
        'assigned',
        'in-progress',
        'repair-completed',
        'verified',
        'rejected',
        'duplicate'
      ],
      default: 'submitted',
      index: true
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: []
    },
    assignedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
      index: true
    },
    assignedAt: {
      type: Date,
      default: null
    },
    dueDate: {
      type: Date,
      default: null
    },
    isOverdue: {
      type: Boolean,
      default: false,
      index: true
    },
    aiDetection: {
      hasDamage: {
        type: Boolean,
        default: false
      },
      detectedClasses: {
        type: [String],
        default: []
      },
      totalDetections: {
        type: Number,
        default: 0
      },
      severityScore: {
        type: Number,
        default: 0
      },
      recommendedPriority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low'
      },
      detections: [
        {
          classId: Number,
          className: String,
          confidence: Number,
          box: [Number] // [x1, y1, x2, y2]
        }
      ],
      annotatedImageUrl: {
        type: String,
        default: null
      }
    }
  },
  {
    timestamps: true
  }
);

// 2dsphere index on location for GeoJSON $near and $geoNear queries
reportSchema.index({ location: '2dsphere' });

// Compound indexes for frequent queries
reportSchema.index({ status: 1, priority: 1, createdAt: -1 });
reportSchema.index({ assignedTeam: 1, status: 1 });
reportSchema.index({ dueDate: 1, isOverdue: 1, status: 1 });

module.exports = mongoose.model('Report', reportSchema);

