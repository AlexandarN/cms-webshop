const express = require('express');
const router = express.Router();

const isValid = require('../middlewares/isValid');
const isAuth = require('../middlewares/isAuth');

const pagesController = require('../controllers/admin/pagesController');
router.get('/pages', isAuth.isAdmin, pagesController.getPagesListPage);
// router.post('/reorder-pages', isAuth.isAdmin, pagesController.postReorderPages);

router.get('/add-page', isAuth.isAdmin, pagesController.getAddPagePage);
router.post('/add-page', isAuth.isAdmin, isValid.checkPageValues, pagesController.postAddPage);

router.get('/edit-page/:slug', isAuth.isAdmin, pagesController.getEditPagePage);
router.post('/edit-page', isAuth.isAdmin, isValid.checkPageValues, pagesController.postEditPage);
router.get('/delete-image/page/:firstSlug', isAuth.isAdmin, pagesController.getDeleteImage);

router.get('/delete-page/:slug', isAuth.isAdmin, pagesController.getDeletePage);


const infoPagesController = require('../controllers/admin/infoPagesController');
router.get('/info-pages', isAuth.isAdmin, infoPagesController.getInfoPagesListPage);
// router.post('/reorder-pages', isAuth.isAdmin, pagesController.postReorderPages);

router.get('/add-info-page', isAuth.isAdmin, infoPagesController.getAddInfoPagePage);
router.post('/add-info-page', isAuth.isAdmin, isValid.checkInfoPageValues, infoPagesController.postAddInfoPage);

router.get('/edit-info-page/:slug', isAuth.isAdmin, infoPagesController.getEditInfoPagePage);
router.post('/edit-info-page', isAuth.isAdmin, isValid.checkInfoPageValues, infoPagesController.postEditInfoPage);

router.get('/delete-info-page/:slug', isAuth.isAdmin, infoPagesController.getDeleteInfoPage);


const categoriesController = require('../controllers/admin/categoriesController');
router.get('/categories', isAuth.isAdmin, categoriesController.getCategoriesListPage);
// router.post('/reorder-categories', isAuth.isAdmin, categoriesController.postReorderCategories);

router.get('/add-category', isAuth.isAdmin, categoriesController.getAddCategoryPage);
router.post('/add-category', isAuth.isAdmin, isValid.checkCategoryValues, categoriesController.postAddCategory);

router.get('/edit-category/:slug', isAuth.isAdmin, categoriesController.getEditCategoryPage);
router.post('/edit-category', isAuth.isAdmin, isValid.checkCategoryValues, categoriesController.postEditCategory);
router.get('/delete-image/category/:firstSlug', isAuth.isAdmin, categoriesController.getDeleteImage);

router.get('/delete-category/:slug', isAuth.isAdmin, categoriesController.getDeleteCategory);


const productsController = require('../controllers/admin/productsController');
router.get('/products', isAuth.isAdmin, productsController.getProductsListPage);

router.get('/add-product', isAuth.isAdmin, productsController.getAddProductPage);
router.post('/add-product', isAuth.isAdmin, isValid.checkProductValues, productsController.postAddProduct);

router.get('/edit-product/:slug', isAuth.isAdmin, productsController.getEditProductPage);
router.post('/edit-product', isAuth.isAdmin, isValid.checkProductValues, productsController.postEditProduct);
// router.post('/product-gallery/:firstSlug', isAuth.isAdmin, productsController.postDropImagesToGallery);
router.get('/delete-galimage/:firstSlug', isAuth.isAdmin, productsController.getDeleteImage);

router.get('/delete-product/:slug', isAuth.isAdmin, productsController.getDeleteProduct);


const brandsController = require('../controllers/admin/brandsController');
router.get('/brands', isAuth.isAdmin, brandsController.getBrandsListPage);

router.get('/add-brand', isAuth.isAdmin, brandsController.getAddBrandPage);
router.post('/add-brand', isAuth.isAdmin, isValid.checkBrandValues, brandsController.postAddBrand);

router.get('/edit-brand/:slug', isAuth.isAdmin, brandsController.getEditBrandPage);
router.post('/edit-brand', isAuth.isAdmin, isValid.checkBrandValues, brandsController.postEditBrand);
router.get('/delete-image/brand/:firstSlug', isAuth.isAdmin, brandsController.getDeleteImage);

router.get('/delete-brand/:slug', isAuth.isAdmin, brandsController.getDeleteBrand);


const infoController = require('../controllers/admin/infoController');
router.get('/edit-info', isAuth.isAdmin, infoController.getEditInfoPage);
router.post('/edit-info', isAuth.isAdmin, infoController.postEditInfo);

router.get('/delete-image/info', isAuth.isAdmin, infoController.getDeleteImage);

module.exports = router;
