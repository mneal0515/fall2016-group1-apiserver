"use strict";

const DEFAULT_STATUS = 404;

var RequestError = require('./').RequestError;

module.exports = function NotFoundError(message, status, code, path) {
    RequestError.apply(this, [
        message || "Not found",
        status || DEFAULT_STATUS,
        code || status || DEFAULT_STATUS,
        path
    ]);
};

require('util').inherits(module.exports, RequestError);