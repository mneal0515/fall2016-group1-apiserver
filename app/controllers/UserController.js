var blueprint = require('@onehilltech/blueprint');
var mongodb = require('@onehilltech/blueprint-mongodb');
var ResourceController = mongodb.ResourceController;
var User = require('../models/User');

function UserController() {
    ResourceController.call(this, {
        name: "user",
        model: User
    });
}

blueprint.controller(UserController, ResourceController);

UserController.prototype.showMe = function () {
    return function (req, res) {
        res.render('user.handlebars', { user: req.user });
    }
};

module.exports = exports = UserController;
