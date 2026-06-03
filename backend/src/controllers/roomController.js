const Room = require('../models/Room');

const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find().sort({ createdAt: 1 });

    return res.status(200).json({ rooms });
  } catch (error) {
    return res.status(500).json({ message: 'Could not fetch rooms', error: error.message });
  }
};

module.exports = {
  getRooms,
};