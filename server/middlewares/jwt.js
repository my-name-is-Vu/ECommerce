const jwt = require('jsonwebtoken');

const generateAccessToken = (uid, role) =>
  jwt.sign({ _id: uid, role }, process.env.JWT_SCRET, { expiresIn: '3d' });

const generateRefreshToken = (uid) =>
  jwt.sign({ _id: uid }, process.env.JWT_SCRET, { expiresIn: '7d' });

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
