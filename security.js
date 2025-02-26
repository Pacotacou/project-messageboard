const { contentSecurityPolicy } = require("helmet")
const { MongoCryptInvalidArgumentError } = require("mongodb")

module.exports = (app,helmet) => {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives,
                'frame-ancestors' : ["'self'"],
            }
        }
    }));

    app.use(helmet.referrerPolicy({
        policy: 'same-origin'
    }));
}