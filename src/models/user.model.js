import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true //searchable
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,

    },
    fullName: {
        type: String,
        required: true,
        trim: true,  // <-- removes leading/trailing spaces
        index: true //searchable
    },
    avatar: {
        type: String, // cloudinary url
        required: true
    },
    coverImage: {
        type: String, // cloudinary url
    
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    refreshToken: {
        type: String
    }
},{timestamps: true})

// Hash password before saving (Mongoose pre-save hook)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Check if password is correct
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password); // return true, false
};


userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET, 
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    });
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET, 
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    });
}

export const User = mongoose.model("User", userSchema);