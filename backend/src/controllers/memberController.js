const Member = require('../models/Member');

const registerMember = async (req, res) => {
  try {
    const { name, sid, faculty, phone } = req.body;

    if (!name || !sid || !faculty || !phone) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!/^\d{10}$/.test(String(sid))) {
      return res.status(400).json({ message: 'รหัสนิสิตต้องเป็นตัวเลข 10 หลัก' });
    }

    const existing = await Member.findOne({ sid: String(sid) });
    if (existing) {
      return res.status(409).json({ message: 'รหัสนิสิตนี้เคยลงทะเบียนไว้แล้ว!' });
    }

    const member = await Member.create({
      name: String(name).trim(),
      sid: String(sid).trim(),
      faculty: String(faculty).trim(),
      phone: String(phone).trim(),
    });

    const count = await Member.countDocuments();

    return res.status(201).json({
      message: 'Registration successful',
      member: { name: member.name, sid: member.sid, faculty: member.faculty, phone: member.phone },
      memberNo: count,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'รหัสนิสิตนี้เคยลงทะเบียนไว้แล้ว!' });
    }
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

const getMember = async (req, res) => {
  try {
    const { sid } = req.params;
    const member = await Member.findOne({ sid: String(sid).trim() });

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    return res.status(200).json({
      member: { name: member.name, sid: member.sid, faculty: member.faculty, phone: member.phone },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Lookup failed', error: error.message });
  }
};

module.exports = { registerMember, getMember };
