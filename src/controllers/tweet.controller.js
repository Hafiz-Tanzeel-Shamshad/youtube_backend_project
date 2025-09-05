import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body;

    if(!content){
        throw new ApiError(400, "Content is required");
    }

    // prevent duplicate tweet for same user
    const existingTweet = await Tweet.findOne({
        content: content,
        owner: req.user._id
    });

    if (existingTweet) {
        throw new ApiError(400, "You already posted this tweet");
    }

    //create tweet
    const tweet = await Tweet.create({
        content: content,
        owner: req.user._id
    });

    res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params;

     // validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    const user = await User.findById(userId);
    
    if(!user){
        throw new ApiError(404, "User not found");
    }

    const tweets = await Tweet.find({owner: userId}).sort({createdAt: -1});

    res
    .status(200)
    .json(new ApiResponse(200, tweets, "User tweets fetched successfully"));
});


const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;   // tweet ID from URL
    const { content } = req.body;     // updated content from request

    if (!content) {
        throw new ApiError(400, "Content is required to update tweet");
    }

    const tweet = await Tweet.findOneAndUpdate(
        { 
            _id: tweetId,
            // Check ownership
            owner: req.user._id // make sure user owns it
        },
        { content },
        { new: true }
    );

    res
      .status(200)
      .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});


const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;

    const tweet = await Tweet.findOneAndDelete({
        _id: tweetId,
        owner: req.user._id // make sure user owns it
    });

    if(!tweet){
        throw new ApiError(404, "Tweet not found or you are not authorized to delete this tweet");
    }
    
    res
      .status(200)
      .json(new ApiResponse(200, tweet, "Tweet deleted successfully"));

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}