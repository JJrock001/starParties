const Booking  = require('../models/Booking');
const Member   = require('../models/Member');
const Activity = require('../models/Activity');

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

const createAdminBooking = async (req, res) => {
  try {
    const { slotId, weekId, day, start, end, night, band, members: memberSids } = req.body;
    if (!slotId || !weekId || !day || !start || !end) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const existing = await Booking.findOne({ slotId, weekId });
    if (existing) return res.status(409).json({ message: 'สล็อตนี้ถูกจองแล้ว' });

    const ids = (memberSids || []).map(s => String(s).trim()).filter(Boolean);
    const memberObjs = [];
    for (const id of ids) {
      const member = await Member.findOne({ sid: id });
      if (!member) return res.status(400).json({ message: `ไม่พบรหัสนิสิต ${id}` });
      memberObjs.push({ sid: id, name: member.name, nickname: member.nickname, phone: member.phone });
    }
    const booking = await Booking.create({
      slotId, weekId, day, start, end, night: !!night,
      band: (band || '').trim() || 'ซ้อมส่วนตัว',
      members: memberObjs,
    });
    return res.status(201).json({ booking });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'สล็อตนี้ถูกจองแล้ว' });
    return res.status(500).json({ message: e.message });
  }
};

const patchBooking = async (req, res) => {
  try {
    const { band, members: memberSids } = req.body;
    const update = {};
    if (band !== undefined) update.band = band;
    if (Array.isArray(memberSids)) {
      const ids = memberSids.map(s => String(s).trim()).filter(Boolean);
      const memberObjs = [];
      for (const id of ids) {
        const member = await Member.findOne({ sid: id });
        if (!member) return res.status(400).json({ message: `ไม่พบรหัสนิสิต ${id}` });
        memberObjs.push({ sid: id, name: member.name, nickname: member.nickname, phone: member.phone });
      }
      update.members = memberObjs;
    }
    const booking = await Booking.findByIdAndUpdate(req.params.id, update, { new: true });
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

// ─── Activities ──────────────────────────────────────────────

const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find().sort({ order: 1, createdAt: -1 }).lean();
    return res.json({ activities });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

const createActivity = async (req, res) => {
  try {
    const { badge, color, date, name, nameTh, tag, tagLabel, imageUrl, description, active, order } = req.body;
    if (!badge || !date || !name || !tagLabel) {
      return res.status(400).json({ message: 'badge, date, name, tagLabel are required' });
    }
    const activity = await Activity.create({ badge, color, date, name, nameTh, tag, tagLabel, imageUrl, description, active, order });
    return res.status(201).json({ activity });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

const updateActivity = async (req, res) => {
  try {
    const activity = await Activity.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    return res.json({ activity });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

const deleteActivity = async (req, res) => {
  try {
    await Activity.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Deleted' });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

module.exports = {
  login,
  getWeeks, getBookings, createAdminBooking, deleteBooking, patchBooking,
  getMembers, updateMember, deleteMember,
  getActivities, createActivity, updateActivity, deleteActivity,
};
