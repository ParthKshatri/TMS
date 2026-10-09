const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const getAccessSecret = () => process.env.JWT_ACCESS_SECRET || 'tms_jwt_access_secret_key_2026';
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || 'tms_jwt_refresh_secret_key_2026';
const getAccessExpire = () => process.env.JWT_ACCESS_EXPIRE || '15m';
const getRefreshExpire = () => process.env.JWT_REFRESH_EXPIRE || '7d';

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    getAccessSecret(),
    { expiresIn: getAccessExpire() }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    getRefreshSecret(),
    { expiresIn: getRefreshExpire() }
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, getAccessSecret());
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, getRefreshSecret());
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken
};
