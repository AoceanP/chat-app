const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireLogin } = require('../middleware');

router.get('/:groupId', requireLogin, async (req, res) => {
  const userId = req.session.user.id;
  const groupId = req.params.groupId;

  const [members] = await db.execute(
    'SELECT user_id FROM group_members WHERE group_id = ?', [groupId]
  );
  const memberIds = members.map(m => m.user_id);
  if (!memberIds.includes(userId)) return res.status(400).send('Access denied');

  const [messages] = await db.execute(`
    SELECT m.id, m.content, m.sent_at, u.username,
      GROUP_CONCAT(CONCAT(r.emoji, ':', r.user_id) SEPARATOR ',') as reactions
    FROM messages m
    JOIN users u ON m.user_id = u.id
    LEFT JOIN reactions r ON m.id = r.message_id
    WHERE m.group_id = ?
    GROUP BY m.id, m.content, m.sent_at, u.username
    ORDER BY m.sent_at ASC
  `, [groupId]);

  for (const msg of messages) {
    await db.execute(
      'INSERT IGNORE INTO message_reads (message_id, user_id) VALUES (?, ?)',
      [msg.id, userId]
    );
  }

  const [group] = await db.execute('SELECT * FROM chat_groups WHERE id = ?', [groupId]);
  const [groupMembers] = await db.execute(`
    SELECT u.username FROM users u
    JOIN group_members gm ON u.id = gm.user_id
    WHERE gm.group_id = ?
  `, [groupId]);

  res.render('chat', {
    user: req.session.user,
    group: group[0],
    messages,
    groupMembers,
    groupId
  });
});

router.post('/:groupId/send', requireLogin, async (req, res) => {
  const userId = req.session.user.id;
  const groupId = req.params.groupId;
  const { content } = req.body;

  const [members] = await db.execute(
    'SELECT user_id FROM group_members WHERE group_id = ?', [groupId]
  );
  const memberIds = members.map(m => m.user_id);
  if (!memberIds.includes(userId)) return res.status(400).send('Access denied');

  await db.execute(
    'INSERT INTO messages (group_id, user_id, content) VALUES (?, ?, ?)',
    [groupId, userId, content]
  );
  res.redirect(`/messages/${groupId}`);
});

router.post('/:groupId/react/:messageId', requireLogin, async (req, res) => {
  const userId = req.session.user.id;
  const { messageId, groupId } = req.params;
  const { emoji } = req.body;
  await db.execute(
    'INSERT INTO reactions (message_id, user_id, emoji) VALUES (?, ?, ?)',
    [messageId, userId, emoji]
  );
  res.redirect(`/messages/${groupId}`);
});

router.post('/:groupId/invite', requireLogin, async (req, res) => {
  const groupId = req.params.groupId;
  const username = req.body.username;

  if (!username) return res.redirect(`/messages/${groupId}`);

  const [users] = await db.execute(
    'SELECT id FROM users WHERE username = ?',
    [username]
  );

  if (users.length === 0) return res.redirect(`/messages/${groupId}`);

  await db.execute(
    'INSERT IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)',
    [groupId, users[0].id]
  );
  res.redirect(`/messages/${groupId}`);
});

module.exports = router;