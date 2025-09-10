import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import  mongoose  from "mongoose";


const generateAccessAndRefreshToken = async (userId)=>{
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken(); 
        const refreshToken = user.generateRefreshToken();

        //save refreshToken in DB
        user.refreshToken = refreshToken; 

        await user.save({validateBeforeSave: false}); // Skip unnecessary validations

        return {accessToken, refreshToken};
    } catch (error) {
        throw new ApiError(400, "something went wrong in server while generating access & refresh token");
        
    }

}


const registerUser = asyncHandler( async (req, res) => {
    //get user details from frontend
    //validation - not empty all fields
    //check if user already exists: username, email
    //check for images, check for avatarImage
    //upload them to cloudinary, avatar
    //create user object - create entry in DB
    //remove password & refresh token fields from response
    //check for user creation
    //return response

    const {username, email, fullName, password} = req.body;

    // validation
    if(
        [username, email, fullName, password].some((field)=> field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    });

    // check existing user
    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }

    // local file paths
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverLocalPath  = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath) {
        throw new ApiError(400, "Please upload avatar image");
    }

    let coverLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverLocalPath = req.files.coverImage[0].path;
    }
 
    // upload images
    const avatarImage = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverLocalPath);

    // create user
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullName,
        password,
        avatar: avatarImage.secure_url,
        coverImage: coverImage?.url || ""
    });

    if (!user) {
        throw new ApiError(500, "User creation failed");
    }

    // Remove sensitive information from the user object
    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    //const { refreshtoken, password, ...safeUser } = user._doc; // remove password safely

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user");
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});



const loginUser = asyncHandler( async (req, res) => {
    // req.body -> data
    //username and email
    //find the user
    //check the password
    //give access token and refresh token
    //send cookie

    const {username, email, password } = req.body;

    if(!(username || email)) {
        throw new ApiError(400, "Username or email is required! ");
    }

    const user = await User.findOne({ 
        $or: [{username}, {email}]
    });

    if (!user) {
        throw new ApiError(400, "User does not exist!")
    }

    const isValidPassword = user.isPasswordCorrect(password);

    if (!isValidPassword) {
        throw new ApiError(401, "Invalid user password!")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {user: loggedInUser, accessToken, refreshToken}, "User logged in successfully!")
    );
});

const logoutUser = asyncHandler( async (req, res) => {

   await User.findByIdAndUpdate(
    req.user._id,
        { 
            $unset: { refreshToken: 1 } // remove refresh token from DB
        },
        {new: true}
    );

   const options = {
       httpOnly: true,
       secure: true
   }

   res.clearCookie("accessToken", options);
   res.clearCookie("refreshToken", options);

   return res.status(200).json(
       new ApiResponse(200, null, "User logged out successfully!")
   );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "No refresh token provided");
    }

    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    if (!decodedToken) {
        throw new ApiError(401, "Invalid refresh token");
    }

    const user = await User.findById(decodedToken._id);

    if (!user) {
        throw new ApiError(401, "User not found");
    }

    if (user.refreshToken !== incomingRefreshToken) {
        throw new ApiError(401, "Refresh token mismatch");
    }

    const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id);

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
        new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed successfully!")
    );
});

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user._id);
    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old password");
    }

    user.password = newPassword
    user.save({validateBeforeSave: false});

    res.status(200)
    .json(new ApiResponse(200,{},"New password sucessfully changed!"))


});

const getCurrentUser = asyncHandler(async(req, res) => {
    res
    .status(200)
    .json(200,req.user,"current user fetch sucessfully")
});

const updateAccountDetails = asyncHandler((req, res) => {
    const {fullName, email} = req.body;

    if(!email || !fullName){
        throw new ApiError(400, "All fields are required")
    }

    const user = User.findByIdAndUpdate(req.user?._id, 
        {
            $set: {
                email,
                fullName: fullName
            }
        },
        {new : true}
    ).select("-password"); // remove password in response

    res
    .status(200)
    .json(new ApiResponse(200, user, "User Account details updated successfully"));

    
});

const updateUserAvatarImage = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    // Todo: delete old avatar image
    if(!avatar.url){
        throw new ApiError(400,"Error while uploading on avatar image");
    }

   const avatarUser = await User.findByIdAndUpdate(req.user._id,
        { 
            $set: { 
                avatar: avatar.url
            } 
        }, 
        { new: true }
    ).select("-password");

   res
   .status(200)
   .json(
       new ApiResponse(200, avatarUser, "User avatar image updated successfully")
   );

});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverLocalPath = req.file?.path;

    if (!coverLocalPath) {
        throw new ApiError(400, "Cover file is missing");
    }

    const cover =  await uploadOnCloudinary(coverLocalPath);

    if(!cover.url){
        throw new ApiError(400,"Error while uploading cover image");
    }

   const coverUser = await User.findByIdAndUpdate(req.user._id,
        { 
            $set: { 
                cover: cover.url
            } 
        }, 
        { new: true }
    ).select("-password");

   res
   .status(200)
   .json(
       new ApiResponse(200, coverUser, "User cover image updated successfully")
   );

});

const getUserChannelProfile  = asyncHandler( async(req, res) => {
    const {username} = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "Username is required");
    }

    const channel = await User.aggregate([
        {
            $match: { 
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
                
            }
        },
        {
            $project: {
                fullName : 1,
                username : 1,
                subscribersCount : 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar : 1,
                coverImage: 1,
                email: 1,
            }
        }
    ]);

    if(!channel?.length){
        throw new ApiError(404, "Channel not found");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User Channel fetched successfully"));

});

const getWatchHistory = asyncHandler(async (req, res) => {

    const user = await User.aggregate([
        { 
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: { 
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: { 
                                $arrayElemAt: ["$owner", 0] 
                            }
                        }
                    }
                ]
            }
       }
    ]);

    res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "User watch history fetched successfully"));
});

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatarImage,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}

