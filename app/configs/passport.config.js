var passport = require('passport-jwt');

module.exports = exports = {
    options: {
        jwtFromRequest: passport.ExtractJwt.fromAuthHeader(),
        secretOrKey: 'secret'
    }
};