var UserController  = require('../../controllers/UserController'),
    passport = require('passport');

module.exports = {
    '/v1': {
        '/users': {
            resource: {
                controller: 'UserController'//,
                //deny: ['getAll']
            }
        }
    }
};
