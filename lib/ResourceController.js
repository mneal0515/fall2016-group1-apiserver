var blueprint = require('@onehilltech/blueprint');
var Mongoose = require('mongoose');
var BaseController = blueprint.BaseController;
var util = require('util');
var _ = require('lodash');
var debug = require('debug');
var async = require('async');

/**
 * @class ResourceController
 *
 * @param options {Object} Options for the ResourceController, such as 'model'.
 * @constructor
 */

function ResourceController(options) {
    BaseController.call(this);

    options = options || {};

    if (!options.model) {
        throw new Error("'model' property must be defined in 'options' parameter")
    }

    this.model = options.model;

    this.hooks = {
        /**
         * By default, hooks are executed synchronously in this order:
         * - normalize.<operation>
         * - normalize.any
         * - authorize.any
         * - authorize.<operation>
         * - pre.any
         * - pre.<operation>
         * - execute.<operation>
         * - post.<operation>
         * - post.any
         *
         * Handlers are compiled in `compileHandlers()` method.
         */
        normalize: {
            create: [],
            get: [],
            getAll: [],
            update: [],
            delete: [],
            any: []
        },

        authorize: {
            any: [],
            create: [],
            get: [],
            getAll: [],
            update: [],
            delete: []
        },

        pre: {
            any: [],
            create: [],
            get: [],
            getAll: [],
            update: [],
            delete: []
        },

        execute: {
            create: this._create,
            get: this._get,
            getAll: this._getAll,
            update: this._update,
            delete: this._delete
        },

        post: {
            create: [],
            get: [],
            getAll: [],
            update: [],
            delete: [],
            any: []
        }
    };

    var self = this;
    _.each(Object.keys(this.hooks), function(key) {
        if (options[key]){
            if (options[key] === "object") {
                self.hooks[key].any.push(options[key]);
            } else {
                _.defaultsDeep(self.hooks[key], options[key]);
            }
        }
    });
}

util.inherits(ResourceController, BaseController);

ResourceController.prototype.__defineGetter__('resourceId', function () {
    return 'id';
});

ResourceController.prototype.registerHandler = function (hook, operation, handler) {
    var hooks = this.hooks;

    if (!hooks[hook]) {
        throw new Error('Invalid hook: ' + hook);
    }

    if (!operation || !handler) {
        return;
    }

    if (!hooks[hook][operation]) {
        throw new Error('Invalid operation: ' + operation);
    }

    if (hooks[hook][operation].constructor === Array) {
        hooks[hook][operation].push(handler);
    } else if (isNull(hooks[hook][operation]) || hooks[hook][operation] === 'function') {
        hooks[hook][operation] = handler;
    }
};

ResourceController.prototype.normalize = function (operation, handler) {
    return this.registerHandler('normalize', operation, handler);
};

ResourceController.prototype.authorize = function (operation, handler) {
    return this.registerHandler('authorize', operation, handler);
};

ResourceController.prototype.pre = function (operation, handler) {
    return this.registerHandler('pre', operation, handler);
};

ResourceController.prototype.post = function (operation, handler) {
    return this.registerHandler('post', operation, handler);
};

ResourceController.prototype.execute = function (operation, handlers) {
    return this.registerHandler('execute', operation, handlers);
};

ResourceController.prototype.create = function () {
    return this.task('create');
};

ResourceController.prototype.get = function () {
    return this.task('get');
};

ResourceController.prototype.getAll = function () {
    return this.task('getAll');
};

ResourceController.prototype.update = function () {
    return this.task('update');
};

ResourceController.prototype.delete = function () {
    return this.task('delete');
};

ResourceController.prototype.compileHandlers = function(operation) {
    var hooks = this.hooks;

    return _.concat(
        hooks.normalize[operation],
        hooks.normalize.any,
        hooks.authorize.any,
        hooks.authorize[operation],
        hooks.pre.any,
        hooks.pre[operation],
        hooks.execute[operation],
        hooks.post[operation],
        hooks.post.any
    );
};

ResourceController.prototype.task = function (operation) {
    var handlers = this.compileHandlers(operation);

    var self = this;

    return function __ResourceController_executeTask(request, response, next) {
        async.eachSeries(handlers, function(listener, callback) {
            if (listener) {
                listener.apply(self, [request, response, callback]);
            } else {
                callback();
            }
        }, function __ResourceController_handleTaskError(error) {
            if (error) {
                return next(error);
            }

            return next();
        });
    }
};

ResourceController.prototype._create = function (request, response, next) {
    // Try converting `_id` to a MongoDB ObjectId
    if (request.body._id) {
        try {
            request.body._id = Mongoose.Types.ObjectId(request.body._id);
        } catch (err) {
            var error = err;
            err.status = 400;
            return next(error);
        }
    }

    var self = this;

    this.model.create(request.body, function (error, result) {
        if (error) {
            return next(error);
        }

        request.params._id = result._id;

        var projection = {
            "__v": 0,
            "password": 0
        };

        self.model.findOne({ _id: result.id}, projection, function (error, result) {
            if (error) {
                return next(error);
            }

            if (!result) {
                error = new Error(self.model.modelName + ' not found');
                error.status = 404;
                return next(error);
            }

            response.status(201);

            response.format({
                default: function () {
                    response.json(result);
                }
            });

            return next();
        });

    });
};

ResourceController.prototype._get = function (request, response, next) {
    var criteria = {};

    if (!typeof request.params._id === Mongoose.Types.ObjectID) {
        try {
            criteria['_id'] = Mongoose.Types.ObjectId(request.params.id);

        } catch (error) {
            criteria['handle'] = request.params.id;
        }
    }

    var projection = {
        "__v": 0,
        "password": 0
    };


    var self = this;
    this.model.findOne(criteria, projection, function (error, result) {
        if (error) {
            return next(error);
        }

        if (!result) {
            error = new Error(self.model.modelName + ' not found');
            error.status = 404;
            return next(error);
        }

        response.format({
            default: function () {
                response.json(result);
            }
        });

        return next();
    });
};


ResourceController.prototype._getAll = function (request, response, next) {

    if (request.query.limit) {
        if (limit > 100) {
            var error = new Error("'limit' must be less than 100");
            error.status = 400;
            return next(error);
        }
    }

    var self = this;

    this.model.count({}, function (error, count) {
        if (error) {
            return next(error);
        }

        var conditions = _.omit(request.query, ['skip', 'limit']);

        var projection = {
            '__v': 0,
            'password': 0
        };

        var options = {
            skip: 0,
            limit: 20
        };

        _.defaultsDeep(options, _.pick(request.query, ['skip', 'limit', 'sort']));

        self.model.find(conditions, projection, options, function (error, results) {
            if (error) {
                return next(error);
            }

            var result = {
                count: count,
                skip: options.skip,
                limit: options.limit
            };

            result[self.model.modelName] = results;

            response.status(200);

            response.format({
                default: function () {
                    response.json(result);
                }
            });

            return next();
        })
    });
};


ResourceController.prototype._update = function (request, response, next) {
    var criteria = {};

    try {
        criteria['_id'] = Mongoose.Types.ObjectId(request.params.id);

    } catch (error) {
        criteria['handle'] = request.params.id;
    }

    var self = this;

    this.model.findOneAndUpdate(criteria, request.body, function (error, result) {
        if (error) {
            return next(error);
        }

        if (!result) {
            error = new Error();
            error.status = 404;
            return next(error);
        }

        var projection = {
            "__v": 0,
            "password": 0
        };

        self.model.findOne({ _id: result.id}, projection, function (error, result) {
            if (error) {
                return next(error);
            }

            if (!result) {
                error = new Error(self.model.modelName + ' not found');
                error.status = 404;
                return next(error);
            }

            response.status(200);

            response.format({
                default: function () {
                    response.json(result);
                }
            });

            return next();
        });
    });
};

ResourceController.prototype._delete = function (request, response, next) {
    var criteria = {};

    try {
        criteria['_id'] = Mongoose.Types.ObjectId(request.params.id);

    } catch (error) {
        criteria['handle'] = request.params.id;
    }

    this.model.findOneAndRemove(criteria, function (error, result) {
        if (error) {
            return next(error);
        }

        response.status(204).send();
        return next();


    });
};

module.exports = ResourceController;