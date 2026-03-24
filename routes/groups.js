const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireLogin } = require('../middleware');

router.get('/', requireLogin, async (req, res) => {
  const userId = req.session.user.id;
  const [groups] = await db.execute(`
    SELECT g.id, g.name,
      MAX(m.sent_at) as last_message,
      COUNT(CASE WHEN mr.user_id IS NULL AND m.user_id != ? THEN 1 END) as unread
    FROM chat_groups g
    JOIN group_members gm ON g.id = gm.group_id
    LEFT JOIN messages m ON g.id = m.group_id
    LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = ?
    WHERE gm.user_id = ?
    GROUP BY g.id, g.name
  `, [userId, userId, userId]);
  res.render('groups', { user: req.session.user, groups });
});

router.get('/create', requireLogin, async (req, res) => {
  const [users] = await db.execute('SELECT id, username FROM users WHERE id != ?', [req.session.user.id]);
  res.render('create-group', { user: req.session.user, users });
});

router.post('/create', requireLogin, async (req, res) => {
  const { name, members } = req.body;
  const userId = req.session.user.id;
  const [result] = await db.execute('INSERT INTO chat_groups (name) VALUES (?)', [name]);
  const groupId = result.insertId;
  await db.execute('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [groupId, userId]);
  const memberList = Array.isArray(members) ? members : members ? [members] : [];
  for (const memberId of memberList) {
    await db.execute('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [groupId, memberId]);
  }
  res.redirect('/groups');
});

module.exports = router;