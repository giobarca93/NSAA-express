const express = require('express')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const jwt = require('jsonwebtoken')
const { type } = require('os')
const { signedCookies } = require('cookie-parser')
const { token } = require('morgan')
const jwtSecret = require('crypto').randomBytes(16) // 16*8= 256 random bits 

const port = 3000

const app = express()

app.use(cookieParser())
app.use(logger('dev'))


/*
Configure the local strategy for use by Passport.
The local strategy requires a `verify` function which receives the credentials
(`username` and `password`) submitted by the user.  The function must verify
that the username and password are correct and then invoke `done` with a user
object, which will be set at `req.user` in route handlers after authentication.
*/
passport.use('local', new LocalStrategy(
    {
        usernameField: 'username', // it MUST match the name of the input field for the username in the login HTML formulary
        passwordField: 'password', // it MUST match the name of the input field for the password in the login HTML formulary
        session: false // we will store a JWT in the cookie with all the required session data. Our server does not need to keep a session, it's stateless
    },
    function (username, password, done) {
        if (username === 'walrus' && password === 'walrus') {
            const user = {
                username: 'walrus',
                description: 'the only user that deserves to contact the fortune teller'
            }
            done(null, user) // the first argument for done is the error, if any. In our case no error so that null. The object user will be added by the passport middleware to req.user and thus will be available there for the next middleware and/or the route handler
        }else{
            return done(null, false) // in passport returning false as the user object means that the authentication process failed.
        }
    }
))

app.use(express.urlencoded({ extended: true })) // needed to retrieve html form fields
app.use(passport.initialize()) // we load the passport auth middleware to our express application. It should be loaded before any route.



app.get('/login',
    (req, res) => {
        res.sendFile('login.html', { root: __dirname })
    }
)

app.post('/login',
    passport.authenticate('local', { failureRedirect: '/login', session: false }),
    (req, res) => {
        // we should create here the JWT for the fortune teller and send it to the user agent inside a cookie.
        // This is what ends up in our JWT
        const jwtClaims = {
            sub: req.user.username,
            iss: 'localhost:3000',
            aud: 'localhost:3000',
            exp: Math.floor(Date.now() / 1000) + 604800, // 1 week (7×24×60×60=604800s) from now
            role: 'user' // just to show a private JWT field
        }

        // generate a signed json web token. By default the signing algorithm is HS256 (HMAC-SHA256), i.e. we will 'sign' with a symmetric secret
        const token = jwt.sign(jwtClaims, jwtSecret)

        // Just for testing, send the JWT directly to the browser. Later on we should send the token inside a cookie.
        //res.cookie("sessions", token, )
        //console.log('Signed Cookies', req.signedCookies)
        //res.json(token)
        res.cookie('secret cookie', token)
        console.log('Signed Cookies: ', req.signedCookies)

        // And let us log a link to the jwt.iot debugger, for easy checking/verifying:
        // console.log(`Token sent. Debug at https://jwt.io/?value=${token}`)
        // console.log(`Token secret (for verifying the signature): ${jwtSecret.toString('base64')}`)

        res.send(`Hello ${req.user.username}, Welcome to the fortune teller <form action="/logout" method="post"><input type="submit" value="Log out"></form`)
    }

)

app.get('/fortune', (req, res) => {

    res.send(`Hello Walrus, Welcome to the fortune teller. Do you feel lucky today? `)
})

app.get('/logout', (req, res) => {
    res.send(`You have been Logged out`)
})



app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send('Something broke!')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})