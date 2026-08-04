import mongoose from "mongoose";
const dailyHydrationSchema=new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        date:{
            type:String,
            required:true,
        },
        goal:{
            type:Number,
            required:true,
        },
        consumed:{
            type:Number,
            default:0,
        },
        streak:{
            type:Number,
            default:0,
        }
    }
)
dailyHydrationSchema.index({ user: 1, date: 1 }, { unique: true });
export const DailyHydration = mongoose.model("DailyHydration", dailyHydrationSchema);