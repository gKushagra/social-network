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
    getPosts,
    addNewPost,
    editPost,
    removePost,
    getFile,
    uploadFile,
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

// posts
router.get('/posts', getPosts);

router.post('/posts', addNewPost);

router.put('/posts', editPost);

router.delete('/posts/:id', removePost);

// files
router.get('/files/:filename', getFile);

router.post('/files', uploadFile);

module.exports = router;