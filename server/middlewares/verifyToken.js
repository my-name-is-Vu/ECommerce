const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

const verifyAccessToken = asyncHandler(async (req, res, next) => {
  // Split Bearer token type: headers: {authorization: Bearer token}
  if (req?.headers?.authorization?.startsWith('Bearer')) {
    const token = req.headers.authorization.split(' ')[1];
    // check token is valid or not
    jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
      if (err)
        return res.status(401).json({
          success: false,
          mes: 'Invalid access token',
        });
      req.user = decode;
      next();
    });
  } else {
    return res.status(401).json({
      success: false,
      mes: 'Require authentication!!!',
    });
  }
});

// admin authorization
const isAdmin = asyncHandler((req, res, next) => {
  const { role } = req.user;
  if (role !== 'admin')
    return res.status(401).json({
      success: false,
      mes: ' REQUIRE ADMIN ROLE',
    });
  next();
});

module.exports = {
  verifyAccessToken,
  isAdmin,
};
