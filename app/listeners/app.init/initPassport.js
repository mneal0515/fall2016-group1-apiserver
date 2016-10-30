'use strict';
var winston = require('winston');
/**
 * initPassport.js
 *
 * This file initializes the different authentication strategies for Passport.js
 * support by your application.
 *
 * Blueprint.js does not install any authentication strategies by default. You will
 * need to first use npm to install the authentication strategy. Then, you can load
 * it into Passport.js here.
 */

var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
;

module.exports = initPassport;

function initPassport(app) {
    var User = app.models.User;
    var opts = {
        usernameField: 'emailAddress',
        session: true
    };

    function authorize(emailAddress, password, done) {
        winston.log('info', password);

        User.findOne({ emailAddress: emailAddress }, function (err, user) {
            winston.log('info', user);
            if (err) { return done(err); }
            if (!user) { return done(null, false); }
            if (!user.validatePassword(password)) { return done(null, false); }
            return done(null, user);
        });
    };

    passport.use(new LocalStrategy(opts, authorize));
}