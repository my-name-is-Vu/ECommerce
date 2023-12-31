const router = require('express').Router();
const ctrls = require('../controllers/user');
const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken');

router.post('/register', ctrls.register);
router.post('/login', ctrls.login);
router.get('/current', verifyAccessToken, ctrls.getCurrent);
router.post('/refrehToken', ctrls.refreshAccessToken);
router.get('/logout', ctrls.logout);
router.get('/forgotPassword', ctrls.forgotPassword);
router.put('/resetPassword', ctrls.resetPassword);
router.get('/', [verifyAccessToken, isAdmin], ctrls.getUsers);
router.delete('/', [verifyAccessToken, isAdmin], ctrls.deleteUser);
router.put('/current', [verifyAccessToken], ctrls.updateUser);
router.put('/:uid', [verifyAccessToken], ctrls.updateUserByAdmin);

module.exports = router;

// Create POST + PUT - body: gửi thông tin k bị lộ
// GET + DELETE - query: gửi thông tin bị lộ (có dạng ?abcd&efgh)
