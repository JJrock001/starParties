const Booking = require('../models/Booking');
const Member  = require('../models/Member');

const ADMIN_TOKEN = process.env.ADMIN_TOKEN    || 'sp-admin-tok';
const ADMIN_USER  = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS  = process.env.ADMIN_PASSWORD || '123';

const DAY_ORDER = { mon:0, tue:1, wed:2, thu:3, fri:4, sat:5, sun:6 };

const login = (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ token: ADMIN_TOKEN });
  }
  return res.status(401).json({ message: 'Invalid credentials' });
};

const getWeeks = async (req, res) => {
  try {
    const weeks = await Booking.distinct('weekId');
    return res.json({ weeks: weeks.sort().reverse() });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

const getBookings = async (req, res) => {
  try {
    const { weekId } = req.query;
    const filter = weekId ? { weekId } : {};
    const bookings = await Booking.find(filter).lean();
    bookings.sort((a, b) => {
      const d = (DAY_ORDER[a.day] ?? 7) - (DAY_ORDER[b.day] ?? 7);
      return d !== 0 ? d : a.start.localeCompare(b.start);
    });
    return res.json({ bookings });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

const deleteBooking = async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Deleted' });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

const patchBooking = async (req, res) => {
  try {
    const { band } = req.body;
    const booking = await Booking.findByIdAndUpdate(req.params.id, { band }, { new: true });
    return res.json({ booking });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

const getMembers = async (req, res) => {
  try {
    const members = await Member.find().sort({ createdAt: 1 }).lean();
    return res.json({ members });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

const updateMember = async (req, res) => {
  try {
    const { name, nickname, faculty, phone } = req.body;
    const member = await Member.findOneAndUpdate(
      { sid: req.params.sid },
      { name, nickname, faculty, phone },
      { new: true }
    );
    if (!member) return res.status(404).json({ message: 'Member not found' });
    return res.json({ member });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

const deleteMember = async (req, res) => {
  try {
    await Member.findOneAndDelete({ sid: req.params.sid });
    return res.json({ message: 'Deleted' });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

module.exports = { login, getWeeks, getBookings, deleteBooking, patchBooking, getMembers, updateMember, deleteMember };
