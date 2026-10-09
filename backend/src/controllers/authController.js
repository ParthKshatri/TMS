const bcrypt = require('bcryptjs');
const User = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken
} = require('../utils/jwt');

const isProduction = process.env.NODE_ENV === 'production';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
});

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact an administrator.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    res.cookie('refreshToken', refreshToken, getCookieOptions());

    res.json({
      success: true,
      message: 'Login successful.',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const incomingToken = req.cookies.refreshToken;
    if (!incomingToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token missing.'
      });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(incomingToken);
    } catch (err) {
      res.clearCookie('refreshToken', getCookieOptions());
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.'
      });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive || user.refreshTokenHash !== hashToken(incomingToken)) {
      res.clearCookie('refreshToken', getCookieOptions());
      return res.status(401).json({
        success: false,
        message: 'Invalid or revoked refresh token.'
      });
    }

    // Rotate refresh token
    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshTokenHash = hashToken(newRefreshToken);
    await user.save();

    res.cookie('refreshToken', newRefreshToken, getCookieOptions());

    res.json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const incomingToken = req.cookies.refreshToken;
    if (incomingToken) {
      try {
        const decoded = verifyRefreshToken(incomingToken);
        const user = await User.findById(decoded.id);
        if (user && user.refreshTokenHash === hashToken(incomingToken)) {
          user.refreshTokenHash = null;
          await user.save();
        }
      } catch (err) {
        // Token already invalid/expired, ignore user lookup error
      }
    } else if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.refreshTokenHash = null;
        await user.save();
      }
    }

    res.clearCookie('refreshToken', getCookieOptions());
    return res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isActive: req.user.isActive,
      createdAt: req.user.createdAt
    }
  });
};

module.exports = {
  login,
  refresh,
  logout,
  getMe
};
