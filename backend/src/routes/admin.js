const router    = require('express').Router();
const adminAuth = require('../middleware/adminAuth');
const {
  login, getWeeks, getBookings, deleteBooking, patchBooking,
  getMembers, updateMember, deleteMember,
} = require('../controllers/adminController');

router.post('/login', login);

router.get('/weeks',           adminAuth, getWeeks);
router.get('/bookings',        adminAuth, getBookings);
router.delete('/bookings/:id', adminAuth, deleteBooking);
router.patch('/bookings/:id',  adminAuth, patchBooking);

router.get('/members',          adminAuth, getMembers);
router.put('/members/:sid',     adminAuth, updateMember);
router.delete('/members/:sid',  adminAuth, deleteMember);

module.exports = router;
