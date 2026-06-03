const Reservation = require('../models/Reservation');
const Room = require('../models/Room');

const createReservation = async (req, res) => {
  try {
    const { roomId, reservationDate, startAt, endAt, note } = req.body;

    if (!roomId || !reservationDate || !startAt || !endAt) {
      return res.status(400).json({ message: 'roomId, reservationDate, startAt, and endAt are required' });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.isAvailable) {
      return res.status(400).json({ message: 'Room is not available' });
    }

    const reservationDay = new Date(reservationDate);
    reservationDay.setHours(0, 0, 0, 0);

    const existingReservation = await Reservation.findOne({
      room: roomId,
      reservationDate: reservationDay,
    });

    if (existingReservation) {
      return res.status(409).json({ message: 'This room is already reserved for this day' });
    }

    const reservation = await Reservation.create({
      user: req.user.id,
      room: roomId,
      reservationDate: reservationDay,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      note: note || '',
    });

    return res.status(201).json({
      message: 'Reservation created successfully',
      reservation,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'This room is already reserved for this day' });
    }

    return res.status(500).json({ message: 'Reservation failed', error: error.message });
  }
};

const getMyReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user.id })
      .populate('room')
      .sort({ reservationDate: -1 });

    return res.status(200).json({ reservations });
  } catch (error) {
    return res.status(500).json({ message: 'Could not fetch reservations', error: error.message });
  }
};

module.exports = {
  createReservation,
  getMyReservations,
};
