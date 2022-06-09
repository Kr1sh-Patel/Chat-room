const asyncHandler = require("express-async-handler");
const caller = require("../helpers/caller");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");

// {{URL}}/api/chat
const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    caller(req, res, "UserId param not sent with request", 400);
  }

  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  if (isChat.length > 0) {
    caller(req, res, isChat[0]);
  } else {
    var chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };

    try {
      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      caller(req, res, FullChat);
    } catch (error) {
      caller(req, res, error.message, 400);
    }
  }
});

// {{URL}}/api/chat
const fetchChats = asyncHandler(async (req, res) => {
  try {
    Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "name pic email",
        });
        caller(req, res, results);
      });
  } catch (error) {
    caller(req, res, error.message, 400);
  }
});

// {{URL}}/api/chat/group
const createGroupChat = asyncHandler(async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return caller(req, res, "Please Fill all the feilds", 400);
  }

  var users = JSON.parse(req.body.users); //parsing stringify array into json

  if (users.length < 2) {
    caller(
      req,
      res,
      "More than 2 users are required to form a group chat",
      400
    );
  }

  users.push(req.user);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    caller(req, res, fullGroupChat);
  } catch (error) {
    caller(req, res, error.message, 400);
  }
});

// {{URL}}/api/chat/group/rename
const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      chatName: chatName,
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    caller(req, res, "Chat NOt Found", 400);
  } else {
    caller(req, res, updatedChat);
  }
});

// {{URL}}/api/chat/group/user
const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  // check if the requester is admin

  const removed = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!removed) {
    caller(req, res, "chat not found", 400);
  } else {
    caller(req, res, "removed");
  }
});

// {{URL}}/api/chat/group/user
const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  // check if the requester is admin

  const added = await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!added) {
    caller(req, res, "Chat Not Found", 400);
  } else {
    caller(req, res, "added");
  }
});

module.exports = {
  addToGroup,
  removeFromGroup,
  renameGroup,
  accessChat,
  fetchChats,
  createGroupChat,
};
