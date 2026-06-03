const router = require('express').Router();

const authRoutes = require('./auth');
const roomRoutes = require('./rooms');
const reservationRoutes = require('./reservations');

router.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

router.use('/auth', authRoutes);
router.use('/rooms', roomRoutes);
router.use('/reservations', reservationRoutes);

module.exports = router;
