/**
 * @author Aleksandar Panich
 * @version Assignment02
 * 
 * - Entry point for the ChatApp Node.js application
 * - Configures Express middleware, session management, and routing
 * - Connects session store to MongoDB for encrypted cookie storage
 *
 * Step 1: Load environment variables and initialize Express
 * Step 2: Register middleware (body parsing, static files, sessions)
 * Step 3: Mount route handlers and start the HTTP server
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

/**
 * Configures encrypted session storage using MongoDB.
 *
 * - Stores session data in MongoDB via connect-mongo
 * - Uses SESSION_SECRET from .env for encryption
 * - Sessions do not save unless data is written (saveUninitialized: false)
 *
 * Step 1: Read secret and MongoDB URI from environment variables
 * Step 2: Create MongoStore connected to MongoDB Atlas
 * Step 3: Attach session middleware to Express
 */
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  })
}));

app.use('/', require('./routes/auth'));
app.use('/groups', require('./routes/groups'));
app.use('/messages', require('./routes/messages'));

process.on('unhandledRejection', (err) => {
  console.log('Warning:', err.message);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));