const router    = require('express').Router();
const adminAuth = require('../middleware/adminAuth');
const {
  login, getWeeks, getBookings, createAdminBooking, deleteBooking, patchBooking,
  getMembers, updateMember, deleteMember,
  getActivities, createActivity, updateActivity, deleteActivity,
} = require('../controllers/adminController');

router.post('/login', login);

router.get('/weeks',           adminAuth, getWeeks);
router.get('/bookings',        adminAuth, getBookings);
router.post('/bookings',       adminAuth, createAdminBooking);
router.delete('/bookings/:id', adminAuth, deleteBooking);
router.patch('/bookings/:id',  adminAuth, patchBooking);

router.get('/members',          adminAuth, getMembers);
router.put('/members/:sid',     adminAuth, updateMember);
router.delete('/members/:sid',  adminAuth, deleteMember);

router.get('/activities',          adminAuth, getActivities);
router.post('/activities',         adminAuth, createActivity);
router.put('/activities/:id',      adminAuth, updateActivity);
router.delete('/activities/:id',   adminAuth, deleteActivity);

module.exports = router;
