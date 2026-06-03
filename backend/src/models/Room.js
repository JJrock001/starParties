const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomName: {
      type: String,
      required: true,
      trim: true,
    },
    roomCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    roomImage: {
      type: String,
      default: '',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Room', roomSchema);