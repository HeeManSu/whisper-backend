import mongoose, { Schema } from "mongoose";
import validator from "validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"
import crypto from "crypto"



const userSchema = new Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"]
    },
    username: {
        type: String,
        required: [true, "Please enter you username"],
        unique: true,
    },
    email: {
        type: String,
        required: [true, "Please enter your email"],
        unique: true,
        validate: {
            validator: validator.isEmail,
            message: "Please enter a valid email address",
        },
    },
    password: {
        type: String,
        required: [true, "Please enter your password"],
        minLength: [6, "Password must be at least 6 characters"],
        select: false,
    },
    avatar: {
        public_id: {
            type: String,
            required: true,

        },
        url: {
            type: String,
            required: true,
        }
    },
    role: {
        type: String,
        //enum means it can have two options.
        enum: ["admin", "user"],
        default: "user",
        required: true,
    },
    resetPasswordToken: String,
    resetPasswordExpire: {
        type: Date,
    },

})

//userSchema.pre("save") It mean before saving hash the password.


userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.getJWTToken = function () {
    return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
        expiresIn: "15d",
    })
}

userSchema.methods.comparePassword = async function (password) {
    // console.log(password)
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.getResetToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    //Expire time is 15 minutes with the current time.
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    return resetToken;
}


export default mongoose.model('User', userSchema);