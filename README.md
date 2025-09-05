
# YouTube Project Backend

This is a professional Node.js backend for a YouTube-like application, built with Express, MongoDB (Mongoose), JWT authentication, Multer, and Cloudinary. It provides a robust API for user management, video publishing, comments, likes, playlists, subscriptions, tweets, and more.

## Features
- User registration, login, logout, and token refresh APIs
- Video publishing, updating, deleting, and listing
- Commenting on videos, updating, and deleting comments
- Like/unlike videos, comments, and tweets
- Playlist creation, update, deletion, and video management
- Channel subscription management
- Tweet creation, update, deletion, and listing
- Dashboard stats and video listing for channels
- Healthcheck endpoint
- MongoDB connection using Mongoose
- JWT authentication and refresh tokens
- File uploads (Multer) and Cloudinary integration
- Error handling middleware and custom error class
- CORS and cookie support

## Project Structure
```
├── package.json
├── public/
│   └── temp/                  # Temporary storage for uploads
├── src/
│   ├── app.js                 # Express app setup and middleware
│   ├── constants.js           # Project constants (DB name)
│   ├── index.js               # Entry point, server start, DB connect
│   ├── controllers/           # All business logic for routes
│   ├── db/
│   │   └── index.js           # MongoDB connection logic
│   ├── middlewares/
│   │   ├── multer.middleware.js # Multer config for uploads
│   │   └── auth.middleware.js   # JWT authentication middleware
│   ├── models/                # Mongoose models (User, Video, etc.)
│   ├── routes/                # All API route definitions
│   │   ├── comment.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── healthcheck.routes.js
│   │   ├── like.routes.js
│   │   ├── playlist.routes.js
│   │   ├── subscription.routes.js
│   │   ├── tweet.routes.js
│   │   ├── user.routes.js
│   │   └── video.routes.js
│   └── utils/
│       ├── ApiError.js        # Custom error class
│       ├── ApiResponse.js     # Standard API response class
│       ├── asyncHandler.js    # Async error handler wrapper
│       └── cloudinary.js      # Cloudinary config and upload utility
```

## Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB instance (local or Atlas)
- Cloudinary account (for media uploads)

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```env
   PORT=8000
   MONGO_URI=your_mongodb_connection_string
   CORS_ORIGIN=http://localhost:3000
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ACCESS_TOKEN_SECRET=your_access_token_secret
   ACCESS_TOKEN_EXPIRY=1d
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   REFRESH_TOKEN_EXPIRY=7d
   ```

### Running the Server
```bash
npm run dev
```
Server will start on the port specified in `.env` (default: 8000).

## API Endpoints

### User
- `POST /api/v1/users/register` — Register a new user (with avatar and optional cover image upload)
- `POST /api/v1/users/login` — Login user (returns access and refresh tokens)
- `POST /api/v1/users/logout` — Logout user (requires JWT)
- `POST /api/v1/users/refresh-token` — Refresh access token (requires refresh token)

### Video
- `GET /api/v1/videos/` — List all videos
- `POST /api/v1/videos/` — Publish a new video (with file upload)
- `GET /api/v1/videos/:videoId` — Get video by ID
- `PATCH /api/v1/videos/:videoId` — Update video (with thumbnail upload)
- `DELETE /api/v1/videos/:videoId` — Delete video
- `PATCH /api/v1/videos/toggle/publish/:videoId` — Toggle publish status

### Comment
- `GET /api/v1/comments/:videoId` — Get comments for a video
- `POST /api/v1/comments/:videoId` — Add comment to a video
- `PATCH /api/v1/comments/c/:commentId` — Update a comment
- `DELETE /api/v1/comments/c/:commentId` — Delete a comment

### Like
- `POST /api/v1/likes/toggle/v/:videoId` — Like/unlike a video
- `POST /api/v1/likes/toggle/c/:commentId` — Like/unlike a comment
- `POST /api/v1/likes/toggle/t/:tweetId` — Like/unlike a tweet
- `GET /api/v1/likes/videos` — Get liked videos

### Playlist
- `POST /api/v1/playlists/` — Create a playlist
- `GET /api/v1/playlists/:playlistId` — Get playlist by ID
- `PATCH /api/v1/playlists/:playlistId` — Update playlist
- `DELETE /api/v1/playlists/:playlistId` — Delete playlist
- `PATCH /api/v1/playlists/add/:videoId/:playlistId` — Add video to playlist
- `PATCH /api/v1/playlists/remove/:videoId/:playlistId` — Remove video from playlist
- `GET /api/v1/playlists/user/:userId` — Get all playlists for a user

### Subscription
- `GET /api/v1/subscriptions/c/:channelId` — Get subscribed channels
- `POST /api/v1/subscriptions/c/:channelId` — Subscribe/unsubscribe to a channel
- `GET /api/v1/subscriptions/u/:subscriberId` — Get channel subscribers

### Tweet
- `POST /api/v1/tweets/` — Create a tweet
- `GET /api/v1/tweets/user/:userId` — Get tweets for a user
- `PATCH /api/v1/tweets/:tweetId` — Update a tweet
- `DELETE /api/v1/tweets/:tweetId` — Delete a tweet

### Dashboard
- `GET /api/v1/dashboard/stats` — Get channel stats
- `GET /api/v1/dashboard/videos` — Get channel videos

### Healthcheck
- `GET /api/v1/healthcheck/` — Healthcheck endpoint

## Models

### User
- `username`: String, required, unique
- `email`: String, required, unique
- `fullName`: String, required
- `avatar`: String (Cloudinary URL), required
- `coverImage`: String (Cloudinary URL), optional
- `watchHistory`: Array of Video references
- `password`: String, hashed
- `refreshToken`: String

#### User Methods
- `isPasswordCorrect(password)`: Checks password
- `generateAccessToken()`: Returns JWT access token
- `generateRefreshToken()`: Returns JWT refresh token

### Video
- `videoFile`: String (Cloudinary URL), required
- `thumbnail`: String (Cloudinary URL), required
- `title`: String, required
- `description`: String, required
- `duration`: String, required
- `views`: Number, default 0
- `ispublished`: Boolean, default true
- `owner`: User reference

## Middleware

- **auth.middleware.js**: Verifies JWT, attaches user to request
- **multer.middleware.js**: Handles file uploads to `public/temp`

## Utilities

- **asyncHandler.js**: Wraps async route handlers for error handling
- **ApiError.js**: Custom error class for API errors
- **ApiResponse.js**: Standard API response format
- **cloudinary.js**: Cloudinary configuration and upload utility

## Error Handling

- All async routes are wrapped with `asyncHandler` for proper error propagation
- Custom errors are thrown using `ApiError` and returned in a consistent format

## Authentication

- JWT-based authentication for protected routes
- Access and refresh tokens are managed securely
- User passwords are hashed using bcrypt

## File Uploads

- Uses Multer to handle file uploads, storing them temporarily in `public/temp` before uploading to Cloudinary

## License
ISC


