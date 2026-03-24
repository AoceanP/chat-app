/**
 * @author Aleksandar Panich
 * @version Assignment02
 *
 * - Handles all message-related routes for the ChatApp
 * - Manages viewing messages, sending messages, reactions, and invites
 * - Tracks read/unread status per user per message
 *
 * Step 1: Verify user is authenticated and is a member of the group
 * Step 2: Query messages and track which are unread for divider display
 * Step 3: Mark messages as read, render chat view or redirect
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireLogin } = require('../middleware');

/**
 * Displays all messages in a chat group.
 *
 * - Enforces authorization: returns 400 if user is not a group member
 * - Tracks first unread message index for Discord-style divider
 * - Marks all messages as read after determining unread index
 * - Fetches group members for the members panel
 *
 * Step 1: Check user is a member of the group, return 400 if not
 * Step 2: Get already-read message IDs, find first unread index
 * Step 3: Mark all messages as read, render chat view
 *
 * @param req.params.groupId - ID of the group to view
 * @param req.session.user.id - ID of the logged-in user
 * @return Renders chat.ejs with messages and unread index
 * @throws 400 if user is not a member of the group
 */
router.get('/:groupId', requireLogin, async (req, res) => {
  const userId = req.session.user.id;
  const groupId = req.params.groupId;

  const [members] = await db.execute(
    'SELECT user_id FROM group_members WHERE group_id = ?', [groupId]
  );
  const memberIds = members.map(m => m.user_id);
  if (!memberIds.includes(userId)) return res.status(400).send('Access denied');

  const [readRows] = await db.execute(
    'SELECT message_id FROM message_reads WHERE user_id = ?', [userId]
  );
  const readIds = new Set(readRows.map(r => r.message_id));

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

  let firstUnreadIndex = -1;
  messages.forEach((msg, i) => {
    if (!readIds.has(msg.id) && msg.username !== req.session.user.username) {
      if (firstUnreadIndex === -1) firstUnreadIndex = i;
    }
  });

  for (const msg of messages) {
    await db.execute(
      'INSERT IGNORE INTO message_reads (message_id, user_id) VALUES (?, ?)',
      [msg.id, userId]
    );
  }

  const [group] = await db.execute(
    'SELECT * FROM chat_groups WHERE id = ?', [groupId]
  );
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
    groupId,
    firstUnreadIndex
  });
});

/**
 * Sends a new message to a chat group.
 *
 * - Verifies the user is a member of the group before inserting
 * - Returns 400 if unauthorized access is attempted
 * - Redirects back to the chat page after sending
 *
 * Step 1: Verify user is a member of the group
 * Step 2: Insert message into messages table
 * Step 3: Redirect to chat page
 *
 * @param req.params.groupId - ID of the group to send to
 * @param req.body.content - Message content
 * @throws 400 if user is not a member of the group
 */
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

/**
 * Adds an emoji reaction to a specific message.
 *
 * - Inserts a reaction record linking user, message, and emoji
 * - Allows duplicate reactions from different users
 * - Redirects back to the chat page after reacting
 *
 * Step 1: Extract messageId, groupId, and emoji from request
 * Step 2: Insert reaction into reactions table
 * Step 3: Redirect to chat page
 *
 * @param req.params.groupId - ID of the group
 * @param req.params.messageId - ID of the message to react to
 * @param req.body.emoji - Emoji character to add as reaction
 */
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

/**
 * Invites a user to a chat group by username.
 *
 * - Looks up the user by username in the database
 * - Silently redirects if username is empty or not found
 * - Uses INSERT IGNORE to prevent duplicate memberships
 *
 * Step 1: Look up user ID by username
 * Step 2: Insert user into group_members with INSERT IGNORE
 * Step 3: Redirect back to chat page
 *
 * @param req.params.groupId - ID of the group to invite to
 * @param req.body.username - Username of the user to invite
 */
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