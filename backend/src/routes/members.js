const router = require('express').Router();
const { registerMember, getMember } = require('../controllers/memberController');

router.post('/', registerMember);
router.get('/:sid', getMember);

module.exports = router;
