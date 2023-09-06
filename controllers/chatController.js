import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import chatModel from "../models/chatModel.js";
import userModel from "../models/userModel.js";
import getDataUri from "../utils/dataUri.js";
import errorHandlerClass from "../utils/errorClass.js";
import { v2 as cloudinary } from 'cloudinary'

export const getAllPersonChats = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user._id;

        const chats = await chatModel.find({
            users: userId,
            isGroupChat: false,
        })
            .populate("users", "-password")
            .populate("groupAdmin", "-password")
            .populate("latestMessage")
            .populate({ path: "latestMessage.sender", select: "name pic email" })
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            chats,
        });
    } catch (error) {
        next(new errorHandlerClass("Unable to fetch all chats", 400));
    }
});

export const createPersonChat = catchAsyncError(async (req, res, next) => {
    const { secondUserId } = req.body;
    const userId = req.user._id;



    if (!secondUserId || !userId) {
        return next(new errorHandlerClass("Please Enter all Fields", 400));
    }

    const secondUser = await userModel.findById(secondUserId);
    const firstUser = await userModel.findById(userId);

    if (!secondUser) {
        return next(new errorHandlerClass("Second user not found", 400));
    }
    const existingChat = await chatModel.findOne({
        isGroupChat: false,
        users: { $all: [userId, secondUserId] },
    })
        .populate("users", "-password")
        .populate({
            path: 'latestMessage',
            populate: { path: 'sender', select: 'name pic email' },
        });

    if (existingChat) {
        return res.status(200).json({
            success: true,
            message: "Chat with this person already exists",
            chat: existingChat,
        });
    }

    const chatData = {
        chatName: "sender",
        isGroupChat: false,
        users: [firstUser, secondUser],
        avatar: {
            public_id: secondUser.avatar.public_id,
            url: secondUser.avatar.url,
        },
    };
    try {
        const newChat = await chatModel.create(chatData);
        const fullChat = await chatModel.findOne({ _id: newChat._id }).populate("users", "-password");

        console.log(fullChat);
        res.status(200).json({
            success: true,
            message: "New Chat Created successfully",
            chat: fullChat,
        })
    } catch (error) {
        next(new errorHandlerClass("Failed to create new chat", 400));
    }
});


export const createGroupChat = catchAsyncError(async (req, res, next) => {

    const { name, users } = req.body;
    const file = req.file;

    // console.log(name)
    // console.log(users)
    // console.log(file)

    if (!name || !users || !file) {
        return next(new errorHandlerClass("Please Enter all Fields", 400));
    }
    var parsedUsers = JSON.parse(users);

    if (parsedUsers.length < 2) {
        return next(new errorHandlerClass("add more than 2 users", 400));
    }

    parsedUsers.push(req.user);

    //upload files on cloudinary
    const fileUri = getDataUri(file);
    // const mycloud = await cloudinary.v2.uploader(fileUri.content)


    try {
        const myCloud = await cloudinary.uploader.upload(fileUri.content)
        // console.log(fileUri)
        // console.log(myCloud)
        const groupChat = await chatModel.create({
            chatName: name,
            users: parsedUsers,
            isGroupChat: true,
            groupAdmin: req.user,
            avatar: {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            }
        });
        const fullGroupChat = await chatModel.findOne({ _id: groupChat._id })
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        res.status(200).json({
            success: true,
            message: "Group chat created",
            newChat: fullGroupChat
        });
    } catch (error) {
        throw new Error(error.message);
    }
});


export const renameGroup = catchAsyncError(async (req, res, next) => {
    try {
        const { newChatName, chatId, } = req.body;
        // console.log(newChatName)
        // console.log(chatId)
        // const filter = { _id: chatId };
        const updatedChatName = await chatModel.findByIdAndUpdate(
            chatId,
            { chatName: newChatName, },
            { new: true, }
        )

            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        if (!updatedChatName) {
            return next(new errorHandlerClass("Chat not found", 400));
        }
        res.status(200).json({
            success: true,
            message: "Group name updated",
            updatedChatName,
        });

    } catch (error) {
        next(new errorHandlerClass("Failed to rename group", 400));

        // throw new Error(error);
    }
});

export const addToGroup = catchAsyncError(async (req, res, next) => {


    try {
        const { chatId, userId } = req.body;

        const chat = await chatModel.findById(chatId);
        if (!chat) {
            return next(new errorHandlerClass("Chat does not exist", 400));
        }

        const existingUserIndex = chat.users.findIndex(user => user.toString() === userId);
        if (existingUserIndex !== -1) {
            return next(new errorHandlerClass("User already exists in the group", 200));
        }

        const added = await chatModel.findOneAndUpdate(
            { _id: chatId },
            { $push: { users: userId } },
            { new: true }
        )
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        if (!added) {
            return next(new errorHandlerClass("Chat does not exist ", 400));
        }
        res.status(200).json({
            success: true,
            message: "user added in the group. Refresh to see changes. 😅",
            added,
        });


    } catch (error) {
        next(new errorHandlerClass("Failed to add new person to group chat", 400));
    }
})


export const removeFromGroup = catchAsyncError(async (req, res, next) => {
    try {
        const { chatId, userId } = req.body;
        const chat = await chatModel.findById(chatId); // Get the chat details
        if (!chat) {
            return next(new errorHandlerClass("Chat does not exist", 400));
        }
        const existingUserIndex = chat.users.findIndex(user => user.toString() === userId);
        if (existingUserIndex === -1) {
            return next(new errorHandlerClass("User not found in the group", 400));
        }
        const removed = await chatModel.findOneAndUpdate(
            { _id: chatId }, 
            { $pull: { users: userId } },
            { new: true }
        )
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        if (!removed) {
            return next(new errorHandlerClass("Chat does not exist ", 400));
        }
        res.status(200).json({
            success: true,
            message: "User removed from the group. Refresh to see changes. ✨",
            removed,
        });
    } catch (error) {
        next(new errorHandlerClass("Failed to remove person from group chat", 400));
    }
})


export const getAllGroupChats = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user._id;

        const groupChats = await chatModel.find({
            users: userId,
            isGroupChat: true,
        })
            .populate("users", "-password")
            .populate("groupAdmin", "-password")
            .populate("latestMessage")
            .populate({ path: "latestMessage.sender", select: "name pic email" })
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            groupChats,
        });
    } catch (error) {
        next(new errorHandlerClass("Unable to fetch all group chats", 400));
    }
});






