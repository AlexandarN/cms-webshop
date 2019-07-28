const express = require('express');
const router = express.Router();

const isAuth = require('../middlewares/isAuth');

const shopController = require('../controllers/shopController');
router.get('/products', shopController.getAllProducts);
router.get('/products/:categorySlug', shopController.getProductsByCategory);
router.get('/products/:categorySlug/:prodSlug', shopController.getProduct);

router.get('/', shopController.getIndexPage);
router.get('/:slug', shopController.getPage);

router.get('/cart/add/:slug', isAuth.isUser, shopController.getAddToCart);
router.get('/cart/checkout', isAuth.isUser, shopController.getCheckoutPage);
router.get('/cart/update/:slug', isAuth.isUser, shopController.getUpdateCart);
router.get('/cart/clear', isAuth.isUser, shopController.getClearCart);

router.post('/cart/checkout/pay', isAuth.isUser, shopController.postPayWithStripe);
router.get('/cart/invoice', isAuth.isUser, shopController.getInvoice);

module.exports = router;