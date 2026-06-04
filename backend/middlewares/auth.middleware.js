const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    const defaultSecret = process.env.JWT_SECRET || 'grademaster_secret';
    // Expecting token format: "Bearer <token>"
    const decoded = jwt.verify(token.replace('Bearer ', ''), defaultSecret);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};
