const express = require('express');
const router = express.Router();
const {
  createGroup,
  getGroups,
  getGroup,
  joinGroup,
  leaveGroup,
  getGroupMembers,
  getGroupPosts,
  inviteMembers,
  acceptGroupInvite,
  declineGroupInvite
} = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');

// Routes pour les groupes
router.route('/')
  .get(protect, getGroups)
  .post(protect, createGroup);

router.route('/:id')
  .get(protect, getGroup);

router.route('/:id/join')
  .post(protect, joinGroup);

router.route('/:id/leave')
  .delete(protect, leaveGroup);

router.route('/:id/members')
  .get(protect, getGroupMembers);

router.route('/:id/posts')
  .get(protect, getGroupPosts);

router.route('/:id/invite')
  .post(protect, inviteMembers);

router.route('/accept-invite')
  .post(protect, acceptGroupInvite);

router.route('/decline-invite')
  .post(protect, declineGroupInvite);

module.exports = router;