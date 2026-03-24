/**
 * @author Aleksandar Panich
 * @version Assignment02
 *
 * - Handles all chat group routes for the ChatApp
 * - Manages viewing, creating, and joining chat groups
 * - Queries unread message counts per group for the logged-in user
 *
 * Step 1: Authenticate user via requireLogin middleware
 * Step 2: Query MySQL for group data including unread counts
 * Step 3: Render appropriate views or redirect after actions
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireLogin } = require('../middleware');

/**
 * Displays all chat groups the logged-in user belongs to.
 *
 * - Fetches groups with last message date and unread count
 * - Unread count excludes messages sent by the user themselves
 * - Only shows groups the user is a member of
 *
 * Step 1: Query groups joined by the user with LEFT JOINs
 * Step 2: Count unread messages (not in message_reads for this user)
 * Step 3: Render groups view with results
 *
 * @param req.session.user.id - ID of the logged-in user
 * @return Renders groups.ejs with group list
 */
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

/**
 * Renders the create group form with a list of available users.
 *
 * - Fetches all users except the currently logged-in user
 * - Passes user list to view for member selection checkboxes
 *
 * Step 1: Query all users excluding current user
 * Step 2: Render create-group view with user list
 *
 * @param req.session.user.id - ID of the logged-in user
 * @return Renders create-group.ejs with users list
 */
router.get('/create', requireLogin, async (req, res) => {
  const [users] = await db.execute(
    'SELECT id, username FROM users WHERE id != ?',
    [req.session.user.id]
  );
  res.render('create-group', { user: req.session.user, users });
});

/**
 * Handles creation of a new chat group.
 *
 * - Inserts new group into chat_groups table
 * - Adds the creator as a member automatically
 * - Adds any selected members from the form checkboxes
 *
 * Step 1: Insert group name into chat_groups, get new group ID
 * Step 2: Insert creator into group_members
 * Step 3: Insert each selected member into group_members
 *
 * @param req.body.name - Name of the new group
 * @param req.body.members - Array of user IDs to add as members
 * @return Redirects to /groups on success
 */
router.post('/create', requireLogin, async (req, res) => {
  const { name, members } = req.body;
  const userId = req.session.user.id;
  const [result] = await db.execute(
    'INSERT INTO chat_groups (name) VALUES (?)', [name]
  );
  const groupId = result.insertId;
  await db.execute(
    'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
    [groupId, userId]
  );
  const memberList = Array.isArray(members) ? members : members ? [members] : [];
  for (const memberId of memberList) {
    await db.execute(
      'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
      [groupId, memberId]
    );
  }
  res.redirect('/groups');
});

module.exports = router;