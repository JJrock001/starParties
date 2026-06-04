const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'sp-admin-tok';

module.exports = (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth === `Bearer ${ADMIN_TOKEN}`) return next();
  return res.status(401).json({ message: 'Unauthorized' });
};
