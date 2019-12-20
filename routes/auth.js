const express = require('express');
const router = express.Router();

const isValid = require('../middlewares/isValid');
const isAuth = require('../middlewares/isAuth');

const authController = require('../controllers/authController');
router.get('/register', authController.getRegisterPage);
router.post('/register', isValid.checkRegisterUser, authController.postRegister);
router.post('/register/billing', isAuth.isUser, isValid.checkAddress, authController.postBillingAddress);
router.post('/register/shipping', isAuth.isUser, isValid.checkAddress, authController.postShippingAddress);

router.get('/login', authController.getLoginPage);
router.post('/login', authController.postLogin);

router.get('/logout', authController.getLogout);

router.get('/dashboard', isAuth.isAdmin, authController.getDashboardPage);

router.get('/reset-password', authController.getResetPasswordPage);
router.post('/reset-password', authController.postResetPassword);
router.get('/new-password/:token', authController.getNewPasswordPage);             
router.post('/new-password', isValid.checkNewPassword,authController.postNewPassword);

router.post('/subscribe', isValid.checkSubscriber, authController.postSubscribe);

module.exports = router;