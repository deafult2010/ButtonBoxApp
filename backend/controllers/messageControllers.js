const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");

//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res) => {
    try {
        const messages = await Message.find({ chat: req.params.chatId })
            .populate("sender", "name pic email")
            .populate("chat");
        res.json(messages);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
const sendMessage = asyncHandler(async (req, res) => {
    const { content, chatId, userId } = req.body;

    if (!content || !chatId || !userId) {
        console.log("Invalid data passed into request");
        return res.sendStatus(400);
    }

    var newMessage = {
        sender: req.user._id,
        content: content,
        chat: chatId,
    };

    try {
        var message = await Message.create(newMessage);

        // Note .execPopulate decomissioned as at V6 Mongoose onwards. See https://youtu.be/m5-6A-MQ0Os?list=PLKhlp2qtUcSZsGkxAdgnPcHioRr-4guZf&t=681
        message = await message.populate("sender", "name pic").execPopulate();
        // Replace with:
        // message = await message.populate(["sender", "name pic"]);
        message = await message.populate("chat").execPopulate();
        // Replace with:
        // message = await message.populate("chat");
        message = await User.populate(message, {
            path: "chat.users",
            select: "name pic email",
        });

        await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message, readBy: [] });

        res.json(message);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

//@description     Update Notifications readBy array
//@route           PUT /api/Message
//@access          Protected
const readBy = asyncHandler(async (req, res) => {
    const { chatId, userId } = req.body;

    const updatedReadBy = await Chat.findByIdAndUpdate(
        chatId,
        {
            $push: { readBy: userId }

        },
        {
            new: true,
        }
    )

    if (!updatedReadBy) {
        res.status(404);
        throw new Error("Chat Not Found");
    } else {
        res.json(updatedReadBy);
    }
});

module.exports = { allMessages, sendMessage, readBy };