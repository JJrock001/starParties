const router = require('express').Router();

const auth = require('../middleware/auth');
const { getMe, login, register, updateMe } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);
router.put('/me', auth, updateMe);

module.exports = router;
