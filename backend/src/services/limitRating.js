import { User } from "../models/user.model.js";

export const saveLimitRating = async (req, res) => {
  try {
    const { limitRating } = req.body;

    if (!limitRating || limitRating < 1 || limitRating > 10) {
      return res.status(400).json({
        success: false,
        message: "Limit rating must be between 1 and 10",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { limitRating },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Limit rating saved successfully",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isBMI: updatedUser.isBMI,
        isOnboarded: updatedUser.isOnboarded,
        bmi: updatedUser.bmi,
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
