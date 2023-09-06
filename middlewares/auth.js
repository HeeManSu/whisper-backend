import Jwt from "jsonwebtoken"
import { catchAsyncError } from "./catchAsyncError.js"
import errorHandlerClass from "../utils/errorClass.js"
import userModel from "../models/userModel.js"


export const isAuthenticated = catchAsyncError(async (req, res, next) => {

    const { token } = req.cookies;

    if (!token) return next(new errorHandlerClass("Not logged in", 401));
    const decoded = Jwt.verify(token, process.env.JWT_SECRET);

    // If the user is found, it adds the user object to the req object as req.user.This allows other middleware functions or route handlers to access the authenticated user's details.
    req.user = await userModel.findById(decoded._id);
    next();
})