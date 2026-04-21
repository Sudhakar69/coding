const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mpin_auth';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

app.get('/', (_req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('auth', {
    mode: 'login',
    message: req.query.message || '',
    error: req.query.error || ''
  });
});

app.get('/register', (req, res) => {
  res.render('auth', {
    mode: 'register',
    message: req.query.message || '',
    error: req.query.error || ''
  });
});

app.post('/register', async (req, res) => {
  try {
    const { name, mpin } = req.body;

    if (!name || !mpin || !/^\d{4}$/.test(mpin)) {
      return res.redirect('/register?error=Please+enter+a+valid+name+and+4-digit+MPIN');
    }

    const existingUser = await User.findOne({ name: name.trim() });
    if (existingUser) {
      return res.redirect('/register?error=User+already+exists');
    }

    const mpinHash = await bcrypt.hash(mpin, 10);
    await User.create({ name: name.trim(), mpinHash });

    return res.redirect('/login?message=Registration+successful.+Please+log+in');
  } catch (error) {
    return res.redirect('/register?error=Registration+failed');
  }
});

app.post('/login', async (req, res) => {
  try {
    const { name, mpin } = req.body;

    if (!name || !mpin) {
      return res.redirect('/login?error=Please+enter+name+and+MPIN');
    }

    const user = await User.findOne({ name: name.trim() });
    if (!user) {
      return res.redirect('/login?error=Invalid+credentials');
    }

    const isMatch = await bcrypt.compare(mpin, user.mpinHash);
    if (!isMatch) {
      return res.redirect('/login?error=Invalid+credentials');
    }

    return res.render('success', { name: user.name });
  } catch (error) {
    return res.redirect('/login?error=Login+failed');
  }
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
