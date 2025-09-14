const Group = require('../models/Group');
const User = require('../models/User');
const Post = require('../models/Post');

// Créer un groupe
exports.createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const group = new Group({
      name,
      description,
      creator: req.user.id,
      members: [req.user.id]
    });
    
    await group.save();
    await group.populate('creator', 'name email');
    
    res.status(201).json({
      success: true,
      data: group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Récupérer tous les groupes
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('creator', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Récupérer un groupe spécifique
exports.getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('creator', 'name email')
      .populate('members', 'name email');
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé'
      });
    }
    
    const isAdmin = group.creator._id.toString() === req.user.id;
    
    res.json({
      success: true,
      data: { ...group.toObject(), isAdmin }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Rejoindre un groupe
exports.joinGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé'
      });
    }
    
    if (group.members.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'Vous êtes déjà membre de ce groupe'
      });
    }
    
    group.members.push(req.user.id);
    await group.save();
    
    res.json({
      success: true,
      message: 'Groupe rejoint avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Quitter un groupe
exports.leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé'
      });
    }
    
    if (group.creator.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Le créateur ne peut pas quitter le groupe'
      });
    }
    
    group.members = group.members.filter(member => member.toString() !== req.user.id);
    await group.save();
    
    res.json({
      success: true,
      message: 'Groupe quitté avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Récupérer les membres d'un groupe
exports.getGroupMembers = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'name email avatarUrl')
      .populate('creator', 'name email avatarUrl');
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé'
      });
    }
    
    const members = group.members.map(member => ({
      ...member.toObject(),
      role: member._id.toString() === group.creator._id.toString() ? 'admin' : 'member'
    }));
    
    res.json({
      success: true,
      data: members
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Récupérer les posts d'un groupe
exports.getGroupPosts = async (req, res) => {
  try {
    const posts = await Post.find({ groupId: req.params.id })
      .populate('author', 'name email avatarUrl')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Inviter des membres
exports.inviteMembers = async (req, res) => {
  try {
    const { userIds } = req.body;
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé'
      });
    }
    
    if (group.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Seul le créateur peut inviter des membres'
      });
    }
    
    // Ajouter les nouveaux membres
    const newMembers = userIds.filter(userId => !group.members.includes(userId));
    group.members.push(...newMembers);
    await group.save();
    
    res.json({
      success: true,
      message: 'Invitations envoyées avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Accepter une invitation de groupe
exports.acceptGroupInvite = async (req, res) => {
  try {
    const { groupId } = req.body;
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé'
      });
    }
    
    if (!group.members.includes(req.user.id)) {
      group.members.push(req.user.id);
      await group.save();
    }
    
    const Notification = require('../models/Notification');
    await Notification.deleteOne({
      recipient: req.user.id,
      type: 'group_invite',
      'data.groupId': groupId
    });
    
    res.json({
      success: true,
      message: 'Invitation acceptée'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Décliner une invitation de groupe
exports.declineGroupInvite = async (req, res) => {
  try {
    const { groupId } = req.body;
    
    const Notification = require('../models/Notification');
    await Notification.deleteOne({
      recipient: req.user.id,
      type: 'group_invite',
      'data.groupId': groupId
    });
    
    res.json({
      success: true,
      message: 'Invitation déclinée'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};