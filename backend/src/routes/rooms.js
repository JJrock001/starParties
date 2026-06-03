const router = require('express').Router();

const { getRooms } = require('../controllers/roomController');

router.get('/', getRooms);

module.exports = router;