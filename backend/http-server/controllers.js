require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../helpers/nodemailer");

mongoose.connect(process.env.mongodbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

// check mongoose connection
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("db connected");
});

require("./models");
const User = mongoose.model("User");
const Reset = mongoose.model("Reset");
const Contact = mongoose.model("Contact");
const Request = mongoose.model("Request");

const domain = `http://localhost:4240`

/**
 * This method checks if a user exists
 * and is verified and returns JWT to client.
 * @param {*} req HTTP Request
 * @param {*} res HTTP Response
 */
const loginController = (req, res) => {
  console.log(req.body);
  const data = req.body;

  User.find({ email: data.email }, (err, user) => {
    if (err) return res.sendStatus(500);
    console.log(user);
    if (user.length > 0) {
      const _user = new User();
      const isVerified = _user.verifyUser(data.password, user[0].hash);

      if (isVerified) {
        return res.status(200).json({
          token: jwt.sign({ user: data.email }, process.env.tokenSkt),
          data: { id: user[0].id, email: user[0].email }
        });
      } else return res.sendStatus(401);
    } else return res.sendStatus(400);
  });
};

/**
 * This method creates a new user in
 * db and returns JWT to client.
 * @param {*} req HTTP Request
 * @param {*} res HTTP Response
 */
const signupController = (req, res) => {
  console.log(req.body);
  const data = req.body;

  //   check if user with this email does not exist
  User.exists({ email: data.email }, (err, exists) => {
    if (err) return res.sendStatus(500);

    if (exists) return res.sendStatus(409);
    else {
      const user = new User(data);

      user.newUser(data.email, data.password);

      console.log(user);

      user.save((err, user) => {
        if (err) return res.sendStatus(500);

        return res.status(200).json({
          token: jwt.sign({ user: data.email }, process.env.tokenSkt),
          data: { id: user.id, email: user.email }
        });
      });
    }
  });
};

/**
 * This method check if token is valid and
 * updates user password
 * @param {*} req HTTP Request
 * @param {*} res HTTP Response
 */
const resetController = (req, res) => {
  console.log(req.body);
  const data = req.body;

  Reset.find({ resetToken: data.token }, (err, resetReq) => {
    if (err) return res.sendStatus(500);
    // console.log(resetReq);
    if (resetReq.length > 0) {
      let expiryDate = new Date(
        resetReq[0].tokenCreatedOn.getTime() + 5 * 60000
      );
      if (+resetReq[0].tokenCreatedOn <= +expiryDate) {
        // console.log(resetReq[0].tokenCreatedOn, expiryDate);
        let user = new User({
          id: resetReq[0].userId,
          email: resetReq[0].userEmail,
          hash: null,
        });

        user.updateHash(data.password);
        console.log(user);

        User.updateOne(
          { id: resetReq[0].userId },
          { hash: user.hash },
          (err, doc) => {
            if (err) return res.sendStatus(500);
            console.log(doc);

            return res.status(200).json("password reset successfully");
          }
        );
      } else return res.sendStatus(400);
    } else return res.sendStatus(400);
  });
};

/**
 * This method checks if a user exists
 * with given email and send a pass reset link to their
 * email.
 * @param {*} req HTTP Request
 * @param {*} res HTTP Response
 */
const getResetLinkController = (req, res) => {
  console.log(req.params.email);
  const email = req.params.email;
  // check if user with this email exists
  User.find({ email: email }, (err, user) => {
    if (err) return res.sendStatus(500);
    console.log(user);
    if (user.length > 0) {
      const reset = new Reset();
      const token = reset.addResetRequest(user[0].email, user[0].id);

      reset.save((err, r) => {
        if (err) return res.sendStatus(500);

        try {
          sendEmail({
            to: user[0].email,
            subject: "Password Reset Link",
            text: `${domain}/reset?token=${token}`,
            html: `<p>Click on this <a href="${domain}/reset?token=${token}">link</a> to reset your password.`,
          });
        } catch (error) {
          return res.sendStatus(500);
        }

        return res.status(200).json("Email with reset link sent");
      });
    } else return res.sendStatus(400);
  });
};

/**
 * get all users on app
 * @param {*} req HTTP Request
 * @param {*} res HTTP Response
 */
const getUsers = (req, res) => {
  User.find({}, (err, users) => {
    if (err) return res.sendStatus(500);
    users = users.map(user => {
      return {
        id: user.id,
        email: user.email
      }
    });
    return res.status(200).json({ users: users })
  });
}

/**
 * get contacts for a user
 * @param {*} req HTTP Request
 * @param {*} res HTTP Response
 */
const getContacts = (req, res) => {
  const contactOwnerId = req.params.id;
  Contact.find({ contactOwnerId: contactOwnerId }, (err, contacts) => {
    if (err) return res.sendStatus(500);

    return res.status(200).json({ contacts: contacts });
  });
}

/**
 * add user to contact list
 * @param {*} req HTTP Request
 * @param {*} res HTTP Response
 */
const addContact = (req, res) => {
  const data = req.body;
  const contact = new Contact({
    contactOwnerId: data.ownerId,
    contactUserId: data.userId,
    contactUserEmail: data.userEmail
  });
  contact.save((err, c) => {
    if (err) return res.sendStatus(500);

    return res.status(201).json('contact added successfully');
  })
}

/**
 * remove a user from contact list
 * @param {*} req HTTP Request
 * @param {*} res HTTP Response
 */
const removeContact = (req, res) => {
  const contactUserId = req.params.id;
  Contact.findOneAndDelete({ contactUserId: contactUserId }, (err, c) => {
    if (err) return res.sendStatus(500);

    return res.status(200).json('contact removed successfully');
  });
}

/**
 * get all requests for user
 * @param {*} req HTTP Request
 * @param {*} res HTTP Response
 */
const getRequests = (req, res) => {
  const _id = req.params.id;
  Request.find({ toUserId: _id, status: 1 }, (err, requests) => {
    if (err) return res.sendStatus(500);

    Request.find({ fromUserId: _id, status: 1 }, (err, sentRequests) => {
      if (err) return res.sendStatus(500);

      return res.status(200).json({ requests, sentRequests });
    })
  });
}

/**
 * add a new request to user
 * @param {*} req HTTP Request
 * @param {*} res HTTP Response
 */
const addRequest = (req, res) => {
  const data = req.body;
  const request = new Request({
    requestId: null,
    fromUserId: data.fromUserId,
    toUserId: data.toUserId,
    status: 1
  });
  request.addNewRequest();
  request.save((err, c) => {
    if (err) return res.sendStatus(500);

    return res.status(201).json('request sent successfully');
  })
}

/**
 * accept request
 * @param {*} req HTTP Request
 * @param {*} res HTTP Response
 */
const acceptRequest = (req, res) => {
  const data = req.body;

  const contact1 = new Contact({
    contactOwnerId: data.fromUserId,
    contactUserId: data.toUserId,
    contactUserEmail: data.toUserEmail
  });

  const contact2 = new Contact({
    contactOwnerId: data.toUserId,
    contactUserId: data.fromUserId,
    contactUserEmail: data.fromUserEmail
  });
  
  contact1.save((err, c) => {
    if (err) return res.sendStatus(500);
  });

  contact2.save((err, c) => {
    if (err) return res.sendStatus(500);
  });

  Request.findOneAndUpdate({ requestId: data.requestId }, { status: 0 }, (err, c) => {
    if (err) return res.sendStatus(500);

    return res.status(200).json('contact added');
  });
}

/**
 * delete request
 * @param {*} req HTTP Request
 * @param {*} res HTTP Response
 */
const cancelRequest = (req, res) => {
  const requestId = req.params.id;
  Contact.findOneAndUpdate({ requestId: requestId }, { status: 0 }, (err, c) => {
    if (err) return res.sendStatus(500);

    return res.status(200).json('request status set inactive');
  });
}

module.exports = {
  loginController,
  signupController,
  resetController,
  getResetLinkController,
  getUsers,
  getContacts,
  addContact,
  removeContact,
  getRequests,
  addRequest,
  acceptRequest,
  cancelRequest,
};
