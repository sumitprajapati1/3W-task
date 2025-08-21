import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { User, ClaimHistory } from './models.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection and server bootstrap
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/leaderboard', {
      serverSelectionTimeoutMS: 10000
    });
    console.log('Connected to MongoDB');

    await initializeUsers();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Error connecting to MongoDB', err);
    process.exit(1);
  }
};

// Initialize default users
const initializeUsers = async () => {
  const existingUsers = await User.countDocuments();
  if (existingUsers === 0) {
    const defaultUsers = [
      { name: 'Rahul', totalPoints: 0 },
      { name: 'Kamal', totalPoints: 0 },
      { name: 'Sanak', totalPoints: 0 },
      { name: 'Priya', totalPoints: 0 },
      { name: 'Amit', totalPoints: 0 },
      { name: 'Sneha', totalPoints: 0 },
      { name: 'Ravi', totalPoints: 0 },
      { name: 'Pooja', totalPoints: 0 },
      { name: 'Vikash', totalPoints: 0 },
      { name: 'Anjali', totalPoints: 0 },
    ];
    
    await User.insertMany(defaultUsers);
    console.log('Default users initialized');
  }
};

// Routes

// Get all users with rankings
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().sort({ totalPoints: -1 });
    const usersWithRanking = users.map((user, index) => ({
      ...user.toObject(),
      rank: index + 1
    }));
    res.json(usersWithRanking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new user
app.post('/api/users', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ name: name.trim() });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const newUser = new User({
      name: name.trim(),
      totalPoints: 0
    });
    
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Claim points for a user
app.post('/api/claim', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Generate random points between 1 and 10
    const randomPoints = Math.floor(Math.random() * 10) + 1;
    
    // Find and update user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.totalPoints += randomPoints;
    await user.save();
    
    // Create claim history entry
    const claimHistory = new ClaimHistory({
      userId: userId,
      userName: user.name,
      pointsAwarded: randomPoints,
      totalPointsAfterClaim: user.totalPoints,
      timestamp: new Date()
    });
    
    await claimHistory.save();
    
    // Get updated rankings
    const users = await User.find().sort({ totalPoints: -1 });
    const usersWithRanking = users.map((user, index) => ({
      ...user.toObject(),
      rank: index + 1
    }));
    
    res.json({
      message: 'Points claimed successfully',
      pointsAwarded: randomPoints,
      user: user,
      leaderboard: usersWithRanking
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get claim history
app.get('/api/history', async (req, res) => {
  try {
    const history = await ClaimHistory.find().sort({ timestamp: -1 }).limit(50);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user-specific history
app.get('/api/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await ClaimHistory.find({ userId }).sort({ timestamp: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
startServer();

export default app;