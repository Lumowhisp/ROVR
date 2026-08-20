
import { User } from "../models/user.model.js"
export const getBMI=async(req,res)=>{
    try{
        const user=await User.findById(req.user.id)
        if(user===null){
            return res.status(404).json({
                message:"User Not Found",
            })
            
        }
        const bmi=user.bmi;
        res.status(200).json({
            message:"BMI Get Call Initialized",
            bmi,
        })
    }
    catch(error){
        console.log(error);
        res.status(500).json({
            message:"Internal Server Error"
        })
    }
}