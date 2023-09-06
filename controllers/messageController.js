import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import errorHandlerClass from "../utils/errorClass.js";
import messageModel from "../models/messageModel.js";
import userModel from "../models/userModel.js";
import chatModel from "../models/chatModel.js";
// import userModel from "../models/userModel.js";
// import chatModel from "../models/chatModel.js";



export const sendMessage = catchAsyncError(async (req, res, next) => {
    const { content, chatId } = req.body;

    if (!content || !chatId) {
        return next(new errorHandlerClass("Please enter all fields", 400));
    }

    var newMessage = {
        sender: req.user._id,
        content: content,
        chat: chatId,
    };

    try {
        var chatMessage = await messageModel.create(newMessage);
        chatMessage = await messageModel.populate(chatMessage, { path: "sender", select: "name pic " });
        chatMessage = await messageModel.populate(chatMessage, "chat");
        const userList = [];


        // console.log(chatMessage)
        // console.log(chatMessage);

        chatMessage = await userModel.populate(chatMessage, {
            path: "chat.users",
            select: "name email",
        });
        chatMessage = await messageModel
            .findById(chatMessage._id)
            .populate("sender", "name pic")
            .populate("chat")
            .populate({
                path: "chat.users",
                select: "name pic email avatar",
            })
            .exec();
        for (let i = 0; i < chatMessage.chat.users.length; i++) {
            const userId = chatMessage.chat.users[i];
            const user = await userModel.findById(userId);
            userList.push(user);
        };
        res.status(200).json({
            success: true,
            users: userList,
            chatMessage,

        });
    } catch (error) {
        throw new Error(error);
    }
});


export const allMessages = catchAsyncError(async (req, res, next) => {

    try {
        const allMessages = await messageModel.find({ chat: req.params.chatId }).populate(
            "sender",
            "name pic email"
        )
            .populate("chat");

        res.status(200).json({
            success: true,
            allMessages,
        });
    } catch (error) {
        throw new Error(error);
    }

})
