const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/usermodel");
const nodemailer = require("nodemailer");
const _ = require("lodash");
const { result } = require("lodash");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
// const passport = require("passport");

process.env.SECRET_key = "secret";
process.env.RESET_key = "secret123secret";
process.env.ClientID="714772129798-2l4rgc57sh0evu2sh3kshqg8mr7pk9fr.apps.googleusercontent.com"
process.env.ClientSecret="1ADdsR7qLz8SFHP4w_SPYVf4"
process.env.Token="1//04qrfgyU4i5Q2CgYIARAAGAQSNwF-L9IrP-Oj4nRgmmDyJqprQr5gDwjqyclup_G7gL9TvlZ8iaCMMZzRBKfRhhxQRxWWBjkv3io"

const userroute = express.Router();
userroute.use(cors());
userroute.get("/", (req, res) => {
  res.send("Url Shortner Backend!!");
});

userroute.get("/dashboard", (req, res) => {
  res.send("Welcomee");
});

//Register

userroute.post("/register", (req, res) => {
  const { Firstname, Lastname, email, password } = req.body;
  User.findOne({ email: email }).then((user) => {
    if (user) {
      res.send({ error: "Email ID Already Registerd" });
    } else {
      const token = jwt.sign(
        { Firstname, Lastname, email, password },
        process.env.SECRET_key,
        { expiresIn: "3 hours" }
      );
      
      const CLIENT_URL = "https://url-shotner-guvi.herokuapp.com"
      const output = `
                <h2>Please click on below link to activate your account</h2>
                <p>${CLIENT_URL}/activate/${token}</p>
                <p><b>NOTE: </b> The above activation link expires in 30 minutes.</p>
                `;
      const oauth2Client = new OAuth2(
        process.env.ClientID,
        process.env.ClientSecret,
     "https://developers.google.com/oauthplayground" // Redirect URL
      );
      oauth2Client.setCredentials({
     refresh_token: process.env.Token
});
const accessToken = oauth2Client.getAccessToken()
      
          
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
         type:"OAuth2",
          user: "nodesuji@gmail.com",
          clientId:process.env.ClientID,
          clientSecret:process.env.ClientSecret,
          refreshToken:process.env.Token,
          accessToken:accessToken
        },
        tls: {
          rejectUnauthorized: false
      }
      });
      const mailOptions = {
        from: '"Auth Admin" <nodejsa@gmail.com>', // sender address
        to: email, // list of receivers
        subject: "Account Verification: NodeJS Auth ✔", // Subject line
        html: output // html body
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("This is error:", error);
          res.json({
            msg: "Something went wrong on our end. Please register again."
          });
        } else {
          console.log("Mail sent : %s", info.response);
          res.json({
            msg: "Activation link sent to email ID. Please activate to log in."
          });
        }
      });
    }
  });
});

//---------------------------------------------------
//Activate Token

userroute.get("/activate/:token", (req, res) => {
  const token = req.params.token;
  if (token) {
    jwt.verify(token, process.env.SECRET_key, (err, decodedToken) => {
      if (err) {
        req.flash(
          "error_msg",
          "Incorrect or expired link! Please register again."
        );
        res.redirect("/register");
      } else {
        const { Firstname, Lastname, email, password } = decodedToken;
        User.findOne({ email: email }).then((user) => {
          if (user) {
            //------------ User already exists ------------//
            res.send({ msg: "Email ID already registered! Please log in." });
            res.redirect("/login");
          } else {
            const newUser = new User({
              Firstname,
              Lastname,
              email,
              password
            });

            bcrypt.genSalt(10, (err, salt) => {
              bcrypt.hash(newUser.password, salt, (err, hash) => {
                if (err) throw err;
                newUser.password = hash;
                newUser
                  .save()
                  .then((user) => {
                    res.send(res.redirect("https://csb-ydibz.netlify.app/login"));
                    // res.redirect('https://ydibz.csb.app/login');
                  })
                  .catch((err) => console.log(err));
              });
            });
          }
        });
      }
    });
  } else {
    console.log("Account activation error!");
  }
});

//---------------------------------------------------------

//Login

userroute.post("/login", async (req, res) => {
  const existingUser = await User.findOne({ email: req.body.email });
  try {
    if (!existingUser) {
      res.json({
        msg: "No such user exist"
      });
    } else {
      const checkuser = await bcrypt.compare(
        req.body.password,
        existingUser.password
      );
      if (!checkuser) {
        res.json({
          msg: "Password invalid"
        });
      } else {
        res.json({
          msg: "Login successfull"
        });
      }
    }
  } catch (err) {
    res.send(err);
  }
});

//Forgot---------------------------

userroute.post("/forgot", (req, res) => {
  const { email } = req.body;
  User.findOne({ email }, (err, user) => {
    if (err || !user) {
      res.status(400).json({
        msg: "User doen not exist"
      });
    } else {
      const token = jwt.sign({ _id: user._id }, process.env.RESET_key, {
        expiresIn: "3 hours"
      });
      
      const CLIENT_URL = "https://url-shotner-guvi.herokuapp.com"
      const output = `
                <h2>Please click on below link to activate your account</h2>
                <p>${CLIENT_URL}/forgot/${token}</p>
                <p><b>NOTE: </b> The above activation link expires in 30 minutes.</p>
                `;

      const oauth2Client = new OAuth2(
        process.env.ClientID,
        process.env.ClientSecret,
     "https://developers.google.com/oauthplayground" // Redirect URL
      );
      oauth2Client.setCredentials({
     refresh_token: process.env.Token
});
const accessToken = oauth2Client.getAccessToken()
      
          
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
         type:"OAuth2",
          user: "nodesuji@gmail.com",
          clientId:process.env.ClientID,
          clientSecret:process.env.ClientSecret,
          refreshToken:process.env.Token,
          accessToken:accessToken
        },
        tls: {
          rejectUnauthorized: false
      }
      });
      
      const mailOptions = {
        from: '"Auth Admin" <nodejsa@gmail.com>', // sender address
        to: email, // list of receivers
        subject: "Account Reset: NodeJS Auth ✔", // Subject line
        html: output // html body
      };

      return user.updateOne({ resetLink: token }, (err, success) => {
        if (err) {
          return res.status(400).json({ msg: "Error" });
        } else {
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log("Fins error", error);
              res.json({
                msg: "Something went wrong on our end. Please register again."
              });
              
            } else {
              console.log("Mail sent : %s", info.response);
              res.json({
                msg:
                  "Activation link sent to email ID. Please activate to log in."
              });
              
            }
          });
        }
      });
    }
  });
});

//-- Page refreshing on clicking and going to reset page..........

userroute.get("/forgot/:token", (req, res) => {
  const { token } = req.params;
  if (token) {
    jwt.verify(token, process.env.RESET_key, (err, decodetoken) => {
      if (err) {
        console.log(err);
        res.status(400).json({
          msg: "Incorrect or expired Link please try again later!"
        });
      } else {
        const { _id } = decodetoken;
        User.findById(_id, (err, user) => {
          if (err) {
            req.status(400).json({
              msg:
                "User with this email Id does not exist. Please try again Later"
            });
          } else {
            res.redirect("https://csb-ydibz.netlify.app/reset");
          }
        });
      }
    });
  }
});

userroute.post("/reset", async (req, res) => {
  const existingUser = await User.findOne({ email: req.body.email });
  try {
    if (!existingUser) {
      res.json({
        msg: "No such user exist"
      });
    } else {
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(req.body.password, salt, (err, hash) => {
          User.findOne({ email: req.body.email }, (err, user) => {
            if (err || !user) {
              console.log(err);
              return res.json({ msg: "User with this token does not exist" });
            } else {
              const obj = {
                password: hash
              };
              user = _.extend(user, obj);
              user.save((err, result) => {
                if (err) {
                  console.log(err);
                  res.json({ msg: "Error resetting password!" });
                } else {
                  res.json({ msg: "Password Changed successfully!" });
                }
              });
            }
          });
        });
      });
    }
  } catch (err) {
    res.send(err);
  }
});

module.exports = userroute;
