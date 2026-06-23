import mongoose from "mongoose";
const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true
    },
    bmi:{
        type:Number,
    },
    weight:{
        type:Number,
    },
    height:{
        type:Number,
    },
    gender:{
        type:String,
    },
    isBMI:{
        type:Boolean
    }
});
export const User=mongoose.model("User",userSchema);
