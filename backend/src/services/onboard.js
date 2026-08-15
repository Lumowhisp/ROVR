
import { User } from "../models/user.model.js";
function compute(weight, height) {
  return weight / (height / 100) ** 2;
}
export const onBoard = async (req, res) => {
  try {
    const { weight, height, gender, dob } = req.body;
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

    const updateData = {
      weight,
      height,
      gender,
      isBMI: true,
      bmi,
    };

    if (dob) {
      updateData.dob = new Date(dob);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      {
        new: true,
      }
    );
    console.log(updatedUser.bmi);
    res.status(200).json({
      success: true,
      message: "BMI calculated Successfully",
      bmi,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isBMI: updatedUser.isBMI,
        isOnboarded: updatedUser.isOnboarded,
        bmi: updatedUser.bmi,
        weight: updatedUser.weight,
        height: updatedUser.height,
        gender: updatedUser.gender,
        limitRating: updatedUser.limitRating,
      },
    });
  
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
