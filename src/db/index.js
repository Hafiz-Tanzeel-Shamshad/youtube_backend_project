import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
       const connectionInstance =  await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log(`MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("Database connection error: ", error);
        process.exit(1); // Exit process with failure
    }

};

export default connectDB;
