const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB connected');
  } catch (err) {
    console.error('✗ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  id: String,
  name: String,
  topics: [String],
  examDate: Date,
  createdAt: { type: Date, default: Date.now },
});

// Session Schema (learning records)
const sessionSchema = new mongoose.Schema({
  userId: String,
  topic: String,
  accuracy: Number,
  timeSpent: Number, // seconds
  questionsAttempted: Number,
  correct: Number,
  timestamp: { type: Date, default: Date.now },
});

// Study Plan Schema
const planSchema = new mongoose.Schema({
  userId: String,
  generatedAt: { type: Date, default: Date.now },
  plan: Array, // 7-day plan
  topicPriorities: Array,
});

const User = mongoose.model('User', userSchema);
const Session = mongoose.model('Session', sessionSchema);
const StudyPlan = mongoose.model('StudyPlan', planSchema);

module.exports = { connectDB, User, Session, StudyPlan };