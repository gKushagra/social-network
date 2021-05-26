const express = require('express');
const { loginController, signupController, resetController, getResetLinkController, getContacts, addContact, removeContact, getUsers } = require('./controllers');
const router = express.Router();

router.post('/auth/login', loginController);

router.post('/auth/signup', signupController);

router.post('/auth/reset', resetController);

router.get('/auth/reset/:email', getResetLinkController);

router.get('/users', getUsers);

router.get('/contacts/:id', getContacts);

router.post('/contacts', addContact);

router.get('/contacts/remove/:id', removeContact);

module.exports = router;