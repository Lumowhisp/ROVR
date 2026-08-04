import mongoose from "mongoose";
import config from "./config.js";
async function connectDB(){
    console.log(config.MONGO_URI.replace(/\/\/.*:.*@/, "//<user>:<password>@"));
    await mongoose.connect(config.MONGO_URI)
    console.log("Connected to MongoDB")

}
export default connectDB;