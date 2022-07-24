const express = require('express');
const {resolve} = require("path")
const router = express.Router();

//Client user
router.use('/trang-chu', require(resolve('./routers/public/home')));

//Admin Dashboard
router.use('/customer', require(resolve('./routers/private/customer')));
router.use('/users', require(resolve('./routers/private/users')));
router.use('/drivers', require(resolve('./routers/private/drivers')));
router.use('/car', require(resolve('./routers/private/listcart')));
router.use('/contract', require(resolve('./routers/private/contract')));
router.use('/test', require(resolve('./routers/private/test')));
module.exports = router;