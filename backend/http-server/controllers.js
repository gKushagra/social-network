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
            text: `http://localhost:4200/reset?token=${token}`,
            html: `<p>Click on this <a href="http://localhost:4200/reset?token=${token}">link</a> to reset your password.`,
          });
        } catch (error) {
          return res.sendStatus(500);
        }

        return res.status(200).json("Email with reset link sent");
      });
    } else return res.sendStatus(400);
  });
};

module.exports = {
  loginController,
  signupController,
  resetController,
  getResetLinkController,
};
