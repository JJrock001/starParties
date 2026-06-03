const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    reservationDate: {
      type: Date,
      required: true,
    },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          const oneHourInMs = 60 * 60 * 1000;
          return this.startAt && value.getTime() - this.startAt.getTime() === oneHourInMs;
        },
        message: 'Reservation must be exactly 1 hour long.',
      },
    },
    status: {
      type: String,
      enum: ['booked', 'cancelled', 'completed'],
      default: 'booked',
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

reservationSchema.index({ room: 1, reservationDate: 1 }, { unique: true });

module.exports = mongoose.model('Reservation', reservationSchema);
