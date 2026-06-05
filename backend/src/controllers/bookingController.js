const Booking  = require('../models/Booking');
const Member   = require('../models/Member');
const Settings = require('../models/Settings');

// ─── Week helpers ────────────────────────────────────────────

// weekId of the current week (used for initial settings creation)
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

// weekId of the NEXT week — used when resetting on Sunday 18:00
// because the schedule being opened is for the upcoming week
const getNextWeekId = () => {
  const d = new Date();
  const dayOfWeek = d.getUTCDay(); // 0=Sun
  const daysUntilNextMon = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(d);
  nextMonday.setUTCDate(d.getUTCDate() + daysUntilNextMon);
  const y = nextMonday.getUTCFullYear();
  const jan1 = new Date(Date.UTC(y, 0, 1));
  const weekNo = Math.ceil(((nextMonday - jan1) / 86400000 + 1) / 7);
  return `${y}-W${String(weekNo).padStart(2, '0')}`;
};

const getOrCreateSettings = async () => {
  let s = await Settings.findOne({ key: 'booking' });
  if (!s) {
    // First boot: use current week, free buffet
    s = await Settings.create({
      key: 'booking',
      value: { weekId: getCurrentWeekId(), mode: 'buffet' },
    });
  }
  return s;
};

// ─── Past slot helpers ───────────────────────────────────────

const DAY_OFFSET = { mon:0, tue:1, wed:2, thu:3, fri:4, sat:5, sun:6 };

// ISO 8601 week: find Monday of week N
// Week 1 = week containing Jan 4
const weekIdToMonday = (weekId) => {
  const [yearStr, weekStr] = weekId.split('-W');
  const year = parseInt(yearStr);
  const week = parseInt(weekStr);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  // Monday of the week containing Jan 4
  const daysToMonday = (1 - jan4Day + 7) % 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(4 + daysToMonday);

  // Monday of week N
  const result = new Date(week1Monday);
  result.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  return result;
};

const isSlotPast = (weekId, day, start) => {
  const monday = weekIdToMonday(weekId);
  const slotDate = new Date(monday);
  slotDate.setUTCDate(monday.getUTCDate() + (DAY_OFFSET[day] ?? 0));
  const [h, m] = start.split(':').map(Number);
  slotDate.setUTCHours(h, m, 0, 0);
  return slotDate < new Date();
};

// ─── Rule constants ──────────────────────────────────────────

const WEEKEND_DAYS  = new Set(['sat', 'sun']);
const WEEKDAY_SET   = new Set(['mon', 'tue', 'wed', 'thu', 'fri']);
const PRIME_STARTS  = new Set(['18:00', '19:00', '20:00']); // 18:00–21:00
const LOCKED_STARTS = new Set(['06:00', '07:00']);           // 06:00–08:00 locked

// ─── GET bookings (public) ────────────────────────────────────

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

// ─── CREATE booking ──────────────────────────────────────────

const createBooking = async (req, res) => {
  try {
    const { slots: slotList, band, members: memberSids } = req.body;

    if (!Array.isArray(slotList) || slotList.length === 0 ||
        !Array.isArray(memberSids) || memberSids.length === 0) {
      return res.status(400).json({ message: 'Missing required booking fields' });
    }

    // ── Validate each slot ──
    for (const s of slotList) {
      if (!s.slotId || !s.day || !s.start || !s.end) {
        return res.status(400).json({ message: 'Invalid slot data' });
      }
      // Rule 6: locked 06:00–08:00
      if (LOCKED_STARTS.has(s.start)) {
        return res.status(400).json({
          message: `ช่วงเวลา ${s.start}–${s.end} ถูกล็อก (06:00–08:00 ไม่เปิดให้จองทุกกรณี)`,
        });
      }
    }

    // ── Per-booking slot count limit ──
    const daytimeSlots = slotList.filter(s => !s.night);
    if (daytimeSlots.length > 0) {
      const slotDay  = daytimeSlots[0].day;
      const isWknd   = WEEKEND_DAYS.has(slotDay);
      const maxPerBk = 3; // both weekday and weekend: up to 3 consecutive hours per block
      if (daytimeSlots.length > maxPerBk) {
        return res.status(400).json({
          message: `จองได้สูงสุด ${maxPerBk} ชั่วโมงต่อเนื่องต่อครั้ง`,
        });
      }
    }

    const settings = await getOrCreateSettings();
    const { weekId, mode } = settings.value;

    // ── Past slot check ──
    for (const s of slotList) {
      if (isSlotPast(weekId, s.day, s.start)) {
        return res.status(400).json({
          message: `ช่วงเวลา ${s.start} ผ่านมาแล้ว ไม่สามารถจองย้อนหลังได้`,
        });
      }
    }

    // ── Slot conflict check ──
    for (const s of slotList) {
      const existing = await Booking.findOne({ slotId: s.slotId, weekId });
      if (existing) {
        return res.status(409).json({ message: `ขออภัย สล็อต ${s.start}–${s.end} เพิ่งโดนจองไปเมื่อครู่` });
      }
    }

    // ── Validate members ──
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

    const finalBand = (band || '').trim() || 'ซ้อมส่วนตัว';

    // ── Rule 9: private practice only in buffet mode ──
    if (mode !== 'buffet' && finalBand === 'ซ้อมส่วนตัว') {
      return res.status(400).json({
        message: 'การจองแบบซ้อมส่วนตัวเปิดได้เฉพาะในโหมด Free Buffet เท่านั้น',
      });
    }

    // ── Quota checks (launch mode, daytime slots only) ──
    if (mode !== 'buffet' && daytimeSlots.length > 0) {
      const slotDay = daytimeSlots[0].day;
      const isWknd  = WEEKEND_DAYS.has(slotDay);
      const dailyMax = isWknd ? 6 : 3;

      // Rule 2/3: daily quota per band
      const existingDay = await Booking.countDocuments({
        weekId, band: finalBand, day: slotDay, night: false,
      });
      if (existingDay + daytimeSlots.length > dailyMax) {
        return res.status(400).json({
          message: `วง "${finalBand}" ใช้โควตาประจำวัน${isWknd ? 'เสาร์/อาทิตย์' : 'ธรรมดา'} ` +
                   `(สูงสุด ${dailyMax} ชม./วัน) เต็มแล้ว`,
        });
      }

      // Rule 4: weekly total quota per band (6h)
      const existingWeek = await Booking.countDocuments({ weekId, band: finalBand, night: false });
      if (existingWeek + daytimeSlots.length > 6) {
        return res.status(400).json({
          message: `วง "${finalBand}" ใช้โควตาสะสมสัปดาห์ (สูงสุด 6 ชม./สัปดาห์) เต็มแล้ว`,
        });
      }

      // Rule 5: Prime Time 18:00–21:00 — consecutive block must not exceed 2h
      const newPrime = daytimeSlots.filter(s => PRIME_STARTS.has(s.start));
      if (newPrime.length > 0) {
        const existingPrime = await Booking.find({
          weekId, band: finalBand, day: slotDay, night: false,
          start: { $in: ['18:00', '19:00', '20:00'] },
        }).lean();

        const allPrime = new Set([
          ...existingPrime.map(b => b.start),
          ...newPrime.map(s => s.start),
        ]);

        // Find longest consecutive run in the Prime Time sequence
        const seq = ['18:00', '19:00', '20:00'];
        let maxRun = 0, run = 0;
        for (const t of seq) {
          run = allPrime.has(t) ? run + 1 : 0;
          maxRun = Math.max(maxRun, run);
        }

        if (maxRun > 2) {
          return res.status(400).json({
            message: `วง "${finalBand}" จองช่วง Prime Time (18:00–21:00) ต่อเนื่องเกิน 2 ชั่วโมงไม่ได้`,
          });
        }
      }
    }

    // ── Create bookings ──
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

// ─── Mode controls ────────────────────────────────────────────

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
    const settings  = await getOrCreateSettings();

    if (state === 'state1') {
      // Open NEXT week's schedule (Sunday 18:00 reset)
      const weekId = getNextWeekId();
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
