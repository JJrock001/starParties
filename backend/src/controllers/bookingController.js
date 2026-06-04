const Booking = require('../models/Booking');
const Member = require('../models/Member');
const Settings = require('../models/Settings');

const getCurrentWeekId = () => {
  const d = new Date();
  const dayOfWeek = d.getUTCDay();
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - ((dayOfWeek + 6) % 7));
  const y = monday.getUTCFullYear();
  const jan1 = new Date(Date.UTC(y, 0, 1));
  const weekNo = Math.ceil(((monday - jan1) / 86400000 + 1) / 7);
  return `${y}-W${String(weekNo).padStart(2, '0')}`;
};

const getOrCreateSettings = async () => {
  let s = await Settings.findOne({ key: 'booking' });
  if (!s) {
    s = await Settings.create({
      key: 'booking',
      value: { weekId: getCurrentWeekId(), mode: 'launch' },
    });
  }
  return s;
};

const WEEKEND_DAYS = new Set(['sat', 'sun']);

const quotaCount = async (sid, day, weekId) => {
  const isWknd = WEEKEND_DAYS.has(day);
  return await Booking.countDocuments({
    weekId,
    night: false,
    day: isWknd ? { $in: ['sat', 'sun'] } : { $nin: ['sat', 'sun'] },
    'members.sid': sid,
  });
};

const getBookings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const { weekId, mode } = settings.value;
    const bookings = await Booking.find({ weekId });

    const bookingsMap = {};
    for (const b of bookings) {
      bookingsMap[b.slotId] = {
        day: b.day, start: b.start, end: b.end, night: b.night,
        band: b.band, members: b.members, at: b.createdAt,
      };
    }

    return res.status(200).json({ bookings: bookingsMap, weekId, mode });
  } catch (error) {
    return res.status(500).json({ message: 'Could not fetch bookings', error: error.message });
  }
};

const WEEKDAY_SET = new Set(['mon', 'tue', 'wed', 'thu', 'fri']);

const createBooking = async (req, res) => {
  try {
    const { slots: slotList, band, members: memberSids } = req.body;

    if (!Array.isArray(slotList) || slotList.length === 0 || !Array.isArray(memberSids) || memberSids.length === 0) {
      return res.status(400).json({ message: 'Missing required booking fields' });
    }

    // Validate slot fields
    for (const s of slotList) {
      if (!s.slotId || !s.day || !s.start || !s.end) {
        return res.status(400).json({ message: 'Invalid slot data' });
      }
    }

    // Weekday: max 3 consecutive daytime hours per booking session
    const weekdayDaytime = slotList.filter(s => !s.night && WEEKDAY_SET.has(s.day));
    if (weekdayDaytime.length > 3) {
      return res.status(400).json({ message: 'วันธรรมดาจองได้สูงสุด 3 ชั่วโมงต่อครั้ง' });
    }

    const settings = await getOrCreateSettings();
    const { weekId, mode } = settings.value;

    // Check no slot is already booked
    for (const s of slotList) {
      const existing = await Booking.findOne({ slotId: s.slotId, weekId });
      if (existing) {
        return res.status(409).json({ message: `ขออภัย สล็อต ${s.start}–${s.end} เพิ่งโดนจองไปเมื่อครู่ กรุณาเลือกเวลาอื่น` });
      }
    }

    const ids = memberSids.map(s => String(s).trim()).filter(Boolean);
    if (new Set(ids).size !== ids.length) {
      return res.status(400).json({ message: 'กรอกรหัสนิสิตซ้ำกันในวง กรุณาตรวจสอบใหม่' });
    }

    const memberObjs = [];
    for (const id of ids) {
      const member = await Member.findOne({ sid: id });
      if (!member) {
        return res.status(400).json({ message: `ไม่พบรหัสนิสิต ${id} ในระบบ กรุณาสมัครสมาชิกชมรมก่อน!` });
      }
      memberObjs.push({ sid: id, name: member.name, nickname: member.nickname, phone: member.phone });
    }

    // Quota check (daytime slots only, split by weekday/weekend)
    if (mode !== 'buffet') {
      const newWkday = slotList.filter(s => !s.night && WEEKDAY_SET.has(s.day)).length;
      const newWkend = slotList.filter(s => !s.night && WEEKEND_DAYS.has(s.day)).length;

      for (const id of ids) {
        if (newWkday > 0) {
          const existing = await quotaCount(id, 'mon', weekId);
          if (existing + newWkday > 3) {
            const m = memberObjs.find(mo => mo.sid === id);
            return res.status(400).json({ message: `สมาชิก ${m ? m.name : id} ใช้โควตาวันธรรมดา (สูงสุด 3 ชม./สัปดาห์) เต็มแล้ว!` });
          }
        }
        if (newWkend > 0) {
          const existing = await quotaCount(id, 'sat', weekId);
          if (existing + newWkend > 6) {
            const m = memberObjs.find(mo => mo.sid === id);
            return res.status(400).json({ message: `สมาชิก ${m ? m.name : id} ใช้โควตาเสาร์-อาทิตย์ (สูงสุด 6 ชม./สัปดาห์) เต็มแล้ว!` });
          }
        }
      }
    }

    const finalBand = (band || '').trim() || 'ซ้อมส่วนตัว';

    for (const s of slotList) {
      await Booking.create({
        slotId: s.slotId, weekId, day: s.day, start: s.start, end: s.end,
        night: !!s.night, band: finalBand, members: memberObjs,
      });
    }

    return res.status(201).json({ message: 'Booking created successfully', count: slotList.length });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'ขออภัย สล็อตเวลานี้เพิ่งโดนจองไปเมื่อครู่ กรุณาเลือกเวลาอื่น' });
    }
    return res.status(500).json({ message: 'Booking failed', error: error.message });
  }
};

const getMode = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.status(200).json(settings.value);
  } catch (error) {
    return res.status(500).json({ message: 'Could not get mode', error: error.message });
  }
};

const setMode = async (req, res) => {
  try {
    const { state } = req.body;
    const settings = await getOrCreateSettings();

    if (state === 'state1') {
      const weekId = getCurrentWeekId();
      await Booking.deleteMany({ weekId: settings.value.weekId });
      settings.value = { weekId, mode: 'launch' };
      settings.markModified('value');
      await settings.save();
    } else if (state === 'state2') {
      settings.value = { ...settings.value, mode: 'buffet' };
      settings.markModified('value');
      await settings.save();
    } else {
      return res.status(400).json({ message: 'Invalid state. Use state1 or state2.' });
    }

    return res.status(200).json(settings.value);
  } catch (error) {
    return res.status(500).json({ message: 'Could not set mode', error: error.message });
  }
};

module.exports = { getBookings, createBooking, getMode, setMode };
