const router = require('express').Router();
const { getBookings, createBooking, getMode, setMode } = require('../controllers/bookingController');

router.get('/mode', getMode);
router.post('/mode', setMode);
router.get('/', getBookings);
router.post('/', createBooking);

module.exports = router;
