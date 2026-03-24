/**
 * @author Aleksandar Panich
 * @version Assignment02
 *
 * - Handles all authentication routes for the ChatApp
 * - Manages user signup, login, and logout functionality
 * - Uses bcrypt for password hashing and session for login state
 *
 * Step 1: Define GET routes to render login and signup pages
 * Step 2: Define POST routes to handle form submissions
 * Step 3: Validate credentials, manage sessions, and redirect
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

router.get('/', (req, res) => res.redirect('/login'));
router.get('/login', (req, res) => res.render('login', { error: null }));
router.get('/signup', (req, res) => res.render('signup', { error: null }));

/**
 * Handles new user registration.
 *
 * - Validates password meets complexity requirements
 * - Hashes password with bcrypt before storing
 * - Redirects to login on success, shows error on failure
 *
 * Step 1: Extract username and password from request body
 * Step 2: Validate password against regex (10+ chars, upper/lower/number/symbol)
 * Step 3: Hash password, insert user into DB, redirect to login
 *
 * @param req.body.username - Desired username
 * @param req.body.password - Plaintext password to hash
 * @throws 'Username already taken' if username exists in DB
 */
router.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{10,}$/;
  if (!passwordRegex.test(password)) {
    return res.render('signup', { error: 'Password must be at least 10 characters with uppercase, lowercase, number and symbol' });
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashed]);
    res.redirect('/login');
  } catch (err) {
    res.render('signup', { error: 'Username already taken' });
  }
});

/**
 * Handles user login.
 *
 * - Looks up user by username in the database
 * - Compares submitted password against stored bcrypt hash
 * - Creates session on success, shows error on failure
 *
 * Step 1: Query DB for user by username
 * Step 2: Compare password with bcrypt
 * Step 3: Set session user and redirect to /groups
 *
 * @param req.body.username - Submitted username
 * @param req.body.password - Submitted plaintext password
 * @throws 'Invalid username or password' if credentials don't match
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) return res.render('login', { error: 'Invalid username or password' });
    const match = await bcrypt.compare(password, rows[0].password);
    if (!match) return res.render('login', { error: 'Invalid username or password' });
    req.session.user = { id: rows[0].id, username: rows[0].username };
    res.redirect('/groups');
  } catch (err) {
    res.render('login', { error: 'Something went wrong' });
  }
});

/**
 * Handles user logout.
 *
 * - Destroys the current session
 * - Redirects to login page
 *
 * Step 1: Call req.session.destroy() to clear session data
 * Step 2: Redirect user to /login
 */
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router;