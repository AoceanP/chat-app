const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

router.get('/', (req, res) => res.redirect('/login'));
router.get('/login', (req, res) => res.render('login', { error: null }));
router.get('/signup', (req, res) => res.render('signup', { error: null }));

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

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router;