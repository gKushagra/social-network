const express = require('express');
const { loginController, signupController, resetController, getResetLinkController } = require('./controllers');
const router = express.Router();

router.post('/auth/login', loginController);

router.post('/auth/signup', signupController);

router.post('/auth/reset', resetController);

router.get('/auth/reset/:email', getResetLinkController);

module.exports = router;