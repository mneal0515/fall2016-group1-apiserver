var mongodb = require('@onehilltech/blueprint-mongodb');
var Schema = mongodb.Schema;
var validator = require('validator');
var bcrypt = require('bcrypt-nodejs');
var uuid = require('uuid');
var jwt = require('jsonwebtoken');

//noinspection JSUnresolvedVariable
var schema = new Schema({
    handle: {
        type: String,
        required: false,
        trim: true,
        validate: [
            validator.isAlphanumeric,
            validator.isLowercase
        ]
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        validate: validator.isAlpha
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    emailAddress: {
        type: String,
        unique: true,
        index: true,
        required: 'Email Address is already being used by someone else',
        trim: true,
        validate: validator.isEmail
    },
    password: {
        type: String,
        required: true
    },
    createdBy: {
        type: mongodb.Schema.Types.ObjectId,
        index: true,
        required: false,
        ref: 'clients'
    },
    meta: {
        type: mongodb.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

//noinspection JSUnresolvedFunction
schema.pre('save', function(next) {
    var user = this;

    //noinspection JSUnresolvedFunction
    if (!user.isModified('password')) {
        return next();
    }

    bcrypt.hash(user.password, null, null, function(error, hash) {
        if (error) {
            return next(error);
        }
        user.password = hash;
        next();
    })
});

//noinspection JSUnresolvedVariable
schema.methods.validatePassword = function(candidatePassword) {
    bcrypt.compare(candidatePassword, this.password, function(error, isMatch) {
        if (error) { return false }
        return isMatch;
    })
};

schema.methods.toJSON = function() {
    var obj = this.toObject();
    delete obj.password;
    return obj;
};


schema.methods.createToken = function() {
    var token = jwt.sign( { user: this.toJSON() },
        app.config.passport.jwtSettings.secret,
        {
            algorithm: app.config.passport.jwtSettings.algorithm,
            expiresInMinutes: app.config.passport.jwtSettings.expiresInMinutes,
            issuer: app.config.passport.jwtSettings.issuer,
            audience: app.config.passport.jwtSettings.audience
        }
    );
    return token;
}


module.exports = exports = mongodb.model('users', schema);
