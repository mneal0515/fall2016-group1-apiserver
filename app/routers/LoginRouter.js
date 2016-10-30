var passport = require('passport');

function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/login');
}

module.exports = exports = {
    '/login': {
        // retrieve the login view
        get: {view: 'login.handlebars'},

        // handle the login process
        post: {
            before: [passport.authenticate('local', {failureRedirect: '/login'})],
            action: 'LoginController@completeLogin'
        }
    },
    '/logout': {
        get: {action: 'LoginController@logout'}
    },
    '/users': {
        use: isLoggedIn,
        '/me': {
            get: {action: 'UserController@showMe'}
        }
    }
};
