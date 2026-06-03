const router = require('express').Router();

const auth = require('../middleware/auth');
const { createReservation, getMyReservations } = require('../controllers/reservationController');

router.post('/', auth, createReservation);
router.get('/me', auth, getMyReservations);

module.exports = router;
