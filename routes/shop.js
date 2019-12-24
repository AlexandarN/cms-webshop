const express = require('express');
const router = express.Router();

const isAuth = require('../middlewares/isAuth');

const shopController = require('../controllers/shopController');
router.get('/products', shopController.getAllProducts);
router.get('/products/:categorySlug', shopController.getProductsByCategory);
router.get('/products/:categorySlug/:prodSlug', shopController.getProduct);

router.get('/brands', shopController.getAllBrands);
router.get('/brands/:brandSlug', shopController.getProductsByBrand);

router.get('/cart', isAuth.isUser, shopController.getCartPage);
router.get('/cart/add/:slug', isAuth.isUser, shopController.getAddToCart);
router.get('/cart/checkout', isAuth.isUser, shopController.getCheckoutPage);
router.post('/cart/checkout/shipping', isAuth.isUser, shopController.postShippingMethod);
router.get('/cart/update/:slug', isAuth.isUser, shopController.getUpdateCart);
router.get('/cart/clear', isAuth.isUser, shopController.getClearCart);

router.get('/wishlist', shopController.getWishlistPage);
router.get('/wishlist/add/:slug', shopController.getAddToWishlist);
router.get('/wishlist/remove/:slug', shopController.getRemoveFromWishlist);

router.get('/orders', isAuth.isUser, shopController.getOrdersPage);
router.get('/orders/:id', isAuth.isUser, shopController.getOrder);
router.get('/orders/invoice/:id', isAuth.isUser, shopController.getInvoice);

router.get('/', shopController.getHomePage);
router.get('/:slug', shopController.getIndexPage);
router.get('/info/:slug', shopController.getInfoPage);

router.post('/cart/checkout/pay', isAuth.isUser, shopController.postPayWithStripe);
router.get('/cart/checkout/buynow', isAuth.isUser, shopController.getPayWithPaypal);

module.exports = router;