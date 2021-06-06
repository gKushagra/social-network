const express = require('express');

const {
    loginController,
    signupController,
    resetController,
    getResetLinkController,
    getContacts,
    addContact,
    removeContact,
    getUsers,
    getRequests,
    addRequest,
    cancelRequest,
    acceptRequest,
} = require('./controllers');

const router = express.Router();

// authentication
router.post('/auth/login', loginController);

router.post('/auth/signup', signupController);

router.post('/auth/reset', resetController);

router.get('/auth/reset/:email', getResetLinkController);

// app users
router.get('/users', getUsers);

// contacts
router.get('/contacts/:id', getContacts);

router.post('/contacts', addContact);

router.get('/contacts/remove/:id', removeContact);

// requests
router.get('/requests/:id', getRequests);

router.post('/requests', addRequest);

router.put('/requests', acceptRequest);

router.put('/requests/:id', cancelRequest);

module.exports = router;