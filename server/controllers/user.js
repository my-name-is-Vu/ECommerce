const User = require('../models/user');
const asyncHandler = require('express-async-handler');
const {
  generateAccessToken,
  generateRefreshToken,
} = require('../middlewares/jwt');
const jwt = require('jsonwebtoken');
const sendMail = require('../ultils/sentMail');
const crypto = require('crypto');

// Register function
const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      success: false,
      mes: 'Missing inputs',
    });
  }

  const user = await User.findOne({ email });
  if (user) {
    throw new Error('User has existed!');
  } else {
    const newUser = await User.create(req.body);
    return res.status(200).json({
      success: newUser ? true : false,
      mes: newUser
        ? 'Register is successfully. Please go login~'
        : 'Something went wrong',
    });
  }
});

// Login function
// Refresh token => create new access token
// Access token => User authentication, user authorization(phân quyền)
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      mes: 'Missing inputs',
    });
  }

  const response = await User.findOne({ email });
  if (response && (await response.isCorrectPassword(password))) {
    // Plain object for using Object Destructuring
    const { password, role, refreshToken, ...userData } = response.toObject();
    // Create access token
    const accessToken = generateAccessToken(response._id, role);
    // Create refresh token
    const newRefreshToken = generateRefreshToken(response._id, role);
    // Save refresh token to DB
    await User.findByIdAndUpdate(
      response._id,
      { refreshToken: newRefreshToken },
      { new: true }
    );
    // Save refresh token to cookie client
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      sucess: true,
      accessToken,
      userData,
    });
  } else {
    throw new Error('Invalid credentials!');
  }
});

const getCurrent = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const user = await User.findById(_id).select('-refreshToken -password -role');
  return res.status(200).json({
    success: user ? true : false,
    rs: user ? user : 'User not found',
  });
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // Get token from cookies
  const cookie = req.cookies;
  // Check if the token is present or not
  if (!cookie && !cookie.refreshToken)
    throw new Error('No refresh token in cookies');
  // Check token is valid or no
  const result = await jwt.verify(cookie.refreshToken, process.env.JWT_SCRET);
  // find the token matches the token stored in the DB
  const response = await User.findOne({
    _id: result._id,
    refreshToken: cookie.refreshToken,
  });
  return res.status(200).json({
    success: response ? true : false,
    newAccessToken: response
      ? generateAccessToken(response._id, response.role)
      : 'Refresh token is not matched',
  });
});

const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie || !cookie.refreshToken) {
    // Delete refresh token in DB
    throw new Error('No refresh token in cookies');
  }
  await User.findOneAndUpdate(
    { refreshToken: cookie.refreshToken },
    { refreshToken: '' },
    { new: true }
  );
  // Delete refresh token in cookie client
  res.clearCookie('refreshToken', { httpOnly: true, secure: true });
  return res.status(200).json({
    success: true,
    mes: 'Logout is done',
  });
});

// Client sent email
// Server check email is valid or not => Sent email + link (password change token)
// Client check mail => click link
// Client sent API with token
// Check the token is the same as the token sent by the server or not
// Change password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (!email) throw new Error('Missing email');
  const user = await User.findOne({ email });
  if (!user) throw new Error('User not found');
  const resetToken = user.createPasswordChangedToken();

  // Must have save to DB
  await user.save();

  const html = `Please enter the link below to change your password. This link will expire after 15 minutes from now. <a href=${process.env.URL_SERVER}/api/user/reset-password/${resetToken}>Click here</a>`;

  const data = {
    email,
    html,
  };
  const reset = await sendMail(data);
  return res.status(200).json({
    success: true,
    reset,
  });
});

// after user click email link
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!password || !token) throw new Error('Missing inputs');

  const passwordResetToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    throw new Error('Invalid reset token');
  } else {
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordChangedAt = Date.now();
    user.passwordResetExpires = undefined;
    await user.save();
    return res.status(200).json({
      success: user ? true : false,
      mes: user ? 'Updated password' : 'Something went wrong',
    });
  }
});

// Get all users for admin
const getUsers = asyncHandler(async (req, res) => {
  const response = await User.find().select('-refreshToken -password -role');
  return res.status(200).json({
    success: response ? true : false,
    users: response,
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const { _id } = req.query;
  if (!_id) throw new Error('Missing inputs');
  const response = await User.findByIdAndDelete(_id);
  return res.status(200).json({
    success: response ? true : false,
    deletedUser: response
      ? `User with email ${response.email} deleted`
      : 'No user delete',
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  if (!_id || Object.keys(req.body).length === 0)
    throw new Error('Missing inputs');
  const response = await User.findByIdAndUpdate(_id, req.body, {
    new: true,
  }).select('-password -role -refreshToken');
  return res.status(200).json({
    success: response ? true : false,
    updatedUser: response ? response : 'Something went wrong',
  });
});

const updateUserByAdmin = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  if (Object.keys(req.body).length === 0) throw new Error('Missing inputs');
  const response = await User.findByIdAndUpdate(uid, req.body, {
    new: true,
  }).select('-password -role -refreshToken');
  return res.status(200).json({
    success: response ? true : false,
    updatedUser: response ? response : 'Something went wrong',
  });
});

module.exports = {
  register,
  login,
  getCurrent,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  getUsers,
  deleteUser,
  updateUser,
  updateUserByAdmin,
};
