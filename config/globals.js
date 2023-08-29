/**
 * Define Global Variables Here
 * global._ = require("lodash")
 */
global.jwt = require("jsonwebtoken")
global.jwtDecode = require("jwt-decode")
global.jwtKey = env["JWT_KEY"]
global.sha256 = require("js-sha256").sha256
global.randomize = require("randomatic")
global.nodemailer = require("nodemailer")
global.transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: env["EMAIL_USERNAME"], // generated ethereal user
        pass: env["EMAIL_PASSWORD"] // generated ethereal password
    }
})

console.log(env["MONGODB_URL"]);
