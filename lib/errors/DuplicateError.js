"use strict";

const DEFAULT_STATUS = 409;

var RequestError = require('./').RequestError;

module.exports = function DuplicateError(message, status, code, path) {
    RequestError.apply(this, [
        message || "Already exists",
        status || DEFAULT_STATUS,
        code || status || DEFAULT_STATUS,
        path
    ]);
};

require('util').inherits(module.exports, RequestError);