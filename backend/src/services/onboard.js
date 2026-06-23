
import { User } from "../models/user.model.js";
function compute(weight, height) {
  return weight / (height / 100) ** 2;
}
export const onBoard = async (req, res) => {
  try {
    const { weight, height, gender } = req.body;
    if (!weight || !height || !gender) {
      console.log("Input Error");
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    if (isNaN(height) || height < 100 || height> 300) {
      return res.status(400).json({
        success: false,
        message: "Invalid height",
      });
    }
    if (isNaN(weight) || weight < 20 || weight > 300) {
      return res.status(400).json({
        success: false,
        message: "Invalid weight",
      });
    }
    const bmi = Number(compute(weight, height).toFixed(2));

    const updatedUser=await User.findByIdAndUpdate(
      req.user.id,
      {
        weight,
        height,
        gender,
        isBMI: true,
        bmi,
      },
      {
        new: true,
      }
    );
    console.log(updatedUser.bmi)
    res.status(200).json({
      success: true,
      message: "BMI calculated Succesfully",
      bmi,
    });
  
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
