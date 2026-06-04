const router = require('express').Router();

const authRoutes = require('./auth');
const roomRoutes = require('./rooms');
const reservationRoutes = require('./reservations');
const memberRoutes = require('./members');
const bookingRoutes = require('./bookings');

router.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

router.use('/auth', authRoutes);
router.use('/rooms', roomRoutes);
router.use('/reservations', reservationRoutes);
router.use('/members', memberRoutes);
router.use('/bookings', bookingRoutes);

module.exports = router;
