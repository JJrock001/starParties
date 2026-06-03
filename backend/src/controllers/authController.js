const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

const signToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const sanitizeUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  studentId: user.studentId,
  nickname: user.nickname,
  joinYear: user.joinYear,
  major: user.major,
  profileImage: user.profileImage,
  email: user.email,
  phone: user.phone,
  role: user.role,
});

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Could not load user', error: error.message });
  }
};

const updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const {
      firstName,
      lastName,
      nickname,
      joinYear,
      major,
      profileImage,
      email,
      phone,
    } = req.body;

    if (email && email.toLowerCase() !== user.email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
      if (existingEmail) {
        return res.status(409).json({ message: 'Email already exists' });
      }
      user.email = email.toLowerCase();
    }

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (nickname !== undefined) user.nickname = nickname;
    if (joinYear !== undefined) user.joinYear = joinYear;
    if (major !== undefined) user.major = major;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Could not update profile', error: error.message });
  }
};

const deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.profileImage = '';
    await user.save();

    return res.status(200).json({ message: 'Profile picture removed', user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Could not remove profile picture', error: error.message });
  }
};

const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      studentId,
      nickname,
      joinYear,
      major,
      profileImage,
      email,
      phone,
      password,
      role,
    } = req.body;

    if (!firstName || !lastName || !studentId || !nickname || !joinYear || !major || !email || !phone || !password) {
      return res.status(400).json({ message: 'Missing required user fields' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { studentId }] });

    if (existingUser) {
      return res.status(409).json({ message: 'Email or student ID already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      studentId,
      nickname,
      joinYear,
      major,
      profileImage: profileImage || '',
      email,
      phone,
      password: hashedPassword,
      role: role || 'user',
    });

    const token = signToken(user);
    res.cookie('token', token, cookieOptions());

    return res.status(201).json({
      message: 'User registered successfully',
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Register failed', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);
    res.cookie('token', token, cookieOptions());

    return res.status(200).json({
      message: 'Login successful',
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateMe,
  deleteProfilePicture,
};
