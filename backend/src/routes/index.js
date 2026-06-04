const router = require('express').Router();

const memberRoutes = require('./members');
const bookingRoutes = require('./bookings');
const adminRoutes  = require('./admin');

router.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

router.use('/members', memberRoutes);
router.use('/bookings', bookingRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
