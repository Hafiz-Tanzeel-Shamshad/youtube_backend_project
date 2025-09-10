import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import formatDuration from "../utils/formatVideoDuration.js"


const getAllVideos = asyncHandler(async (req, res) => {

    //TODO: get all videos based on query, sort, pagination

    let { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

    // Convert page & limit to numbers
    page = parseInt(page);
    limit = parseInt(limit);

    // Build filters
    const filters = {};
    if (query) {
        // search by title
        filters.title = { $regex: query, $options: "i" }; // case-insensitive search
    }
    
    // If userId is provided, filter videos by that user
    if (userId) {
        filters.owner = userId;  // filter by user
    }

    // Only fetch published videos
    filters.ispublished = true;

    // Sorting
    const sortOptions = {};
    // Set sort direction: 1 for ascending, -1 for descending
    sortOptions[sortBy] = sortType === "asc" ? 1 : -1;

    // Fetch videos with pagination + owner details
    const videos = await Video.find(filters)
        .populate("owner", "username email avatar")
        .sort(sortOptions)
        .skip((page - 1) * limit)   
        .limit(limit);

    // Count total videos (for pagination info)
    const totalVideos = await Video.countDocuments(filters);

    res.status(200).json(
        new ApiResponse(200, {
        videos,
        pagination: {
            total: totalVideos,
            page,
            limit,
            totalPages: Math.ceil(totalVideos / limit),
        },
        }, "Videos fetched successfully")
    );
});

    

const publishAVideo = asyncHandler(async (req, res) => {
    
    const { title, description} = req.body;

    if (!req.files || !req.files.videoFile || !req.files.thumbnail) {
        return res.status(400).json(new ApiError(400, "videoFile and thumbnail are required"));
    }

    // Upload files to Cloudinary
    const videoFileLocalPath = req.files.videoFile[0].path;
    const thumbnailLocalPath = req.files.thumbnail[0].path;

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoFile?.url || !thumbnail?.url) {
        return res.status(400).json(new ApiError(400, "File upload failed"));
    }

    // Save to DB
    const video = await Video.create({
        title,
        description,
        duration : formatDuration(videoFile.duration),  // store "HH:MM:SS"
        videoFile: videoFile.url,   //  store Cloudinary URL
        thumbnail: thumbnail.url,   //  store Cloudinary URL
        owner: req.user._id,        //  ensure user is logged in
    });

    res
    .status(201)
    .json(
        new ApiResponse(201, video, "Video published successfully")
    );
});

const getVideoById = asyncHandler(async (req, res) => {
    //TODO: get video by id
    const { videoId } = req.params;

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video not found");
    }

    // video with owner details
    const videoWithOwner = await video.populate("owner", "username email avatar");

    res
    .status(200)
    .json(new ApiResponse(200, videoWithOwner, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    //TODO: update video details like title, description, thumbnail
    const { videoId } = req.params;

    const {title, description} = req.body;

    const thumbnailLocalPath = req.file?.path;

    if(!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is required");
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    const updatedVideo = await Video.findByIdAndUpdate(videoId,
        {
            $set: {
                title,
                description,
                thumbnail: thumbnail.secure_url
            }
        }, {new: true}
    );

    res
    .status(200)
    .json(new ApiResponse(200, {updatedVideo}, "Video updated successfully"));

});

const deleteVideo = asyncHandler(async (req, res) => {
    //TODO: delete video
    const { videoId } = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId");
    }

    // Todo: delete image form cloudinary
    const deletedVideo = await Video.findByIdAndDelete(videoId);

    res
    .status(200)
    .json(new ApiResponse(200, {deleteVideo}, "Video deleted successfully"));
    
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "Video not found");
    }

    video.ispublished = !video.ispublished;
    await video.save({validateBeforeSave: false});

    res
    .status(200)
    .json(new ApiResponse(200, {video}, "Video publish status toggled successfully"));

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}