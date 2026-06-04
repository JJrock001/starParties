const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    slotId: { type: String, required: true },
    weekId: { type: String, required: true },
    day: { type: String, required: true },
    start: { type: String, required: true },
    end: { type: String, required: true },
    night: { type: Boolean, default: false },
    band: { type: String, required: true, default: 'ซ้อมส่วนตัว' },
    members: [{ sid: String, name: String, nickname: String, phone: String }],
  },
  { timestamps: true }
);

bookingSchema.index({ slotId: 1, weekId: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);
