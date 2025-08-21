import mongoose from 'mongoose';

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  totalPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  avatar: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Claim History Schema
const claimHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  pointsAwarded: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  totalPointsAfterClaim: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create models
const User = mongoose.model('User', userSchema);
const ClaimHistory = mongoose.model('ClaimHistory', claimHistorySchema);

export {
  User,
  ClaimHistory
};