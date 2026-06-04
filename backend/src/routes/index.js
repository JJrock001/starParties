const router   = require('express').Router();
const Activity = require('../models/Activity');

const memberRoutes  = require('./members');
const bookingRoutes = require('./bookings');
const adminRoutes   = require('./admin');

router.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

router.get('/activities', async (req, res) => {
  try {
    const activities = await Activity.find({ active: true }).sort({ order: 1, createdAt: -1 }).lean();
    return res.json({ activities });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

router.use('/members', memberRoutes);
router.use('/bookings', bookingRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
