import express from "express"
import { isAuthenticated } from "../middlewares/auth.js";
import { addToGroup, createGroupChat, createPersonChat, getAllGroupChats, getAllPersonChats, removeFromGroup, renameGroup } from "../controllers/chatController.js";
import singleUpload from "../middlewares/multer.js";


const router = express.Router();


//Get request to fetch all chats and post to create one to one chat
router.route("/personchat").get(isAuthenticated, getAllPersonChats);
router.route("/personchat").post(isAuthenticated, createPersonChat);
//Get details of a specific chat. Delete particular chat. 
// router.route("/personchat").get(isAuthenticated, )


//Group Chat API
router.route("/groupchat").post(isAuthenticated, singleUpload, createGroupChat).get(isAuthenticated, getAllGroupChats);
router.route("/rename").put(isAuthenticated, renameGroup);
router.route("/groupremove").put(isAuthenticated, removeFromGroup);
router.route("/groupadd").put(isAuthenticated, addToGroup);

export default router;