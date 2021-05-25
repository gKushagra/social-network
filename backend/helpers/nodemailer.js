require("dotenv").config();
const nodemailer = require("nodemailer");

function sendEmail(data) {
  let transporter = nodemailer.createTransport({
    host: process.env.ehost,
    port: process.env.eport,
    secure: true,
    auth: {
      user: process.env.euser,
      pass: process.env.epass,
    },
  });

  try {
    transporter.sendMail({
      from: process.env.euser,
      to: data.to,
      subject: data.subject,
      text: data.text,
      html: data.html,
    });
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}

module.exports = {
  sendEmail,
};
