import mongoose from 'mongoose';

const streakSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: 'default-user'
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastUnderBudgetDate: {
    type: Date
  },
  weeklyUnderBudget: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

streakSchema.index({ userId: 1 });

export default mongoose.model('Streak', streakSchema);
