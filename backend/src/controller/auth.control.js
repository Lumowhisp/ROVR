import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User Already Exists",
      });
    }
    const hashedPass = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPass,
    });
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      config.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );
    res.status(201).json({
      message: "User Created Successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isBMI: user.isBMI,
        isOnboarded: user.isOnboarded,
        bmi: user.bmi,
        limitRating: user.limitRating,
      },
      token,
    });
    console.log("User Created Successfully");
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid) {
        const token = jwt.sign(
          {
            id: user._id,
            email: user.email,
          },
          config.JWT_SECRET,
          {
            expiresIn: "7d",
          }
        );
        res.status(200).json({
          message: "User Authenticated",
          token,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            isBMI: user.isBMI,
            isOnboarded: user.isOnboarded,
            bmi: user.bmi,
            limitRating: user.limitRating,
          },
        });
      } else {
        console.log("Invalid Credentials");
        return res.status(401).json({
          message: "Invalid Credentials",
        });
      }
    } else {
      return res.status(401).json({
        message: "User doesn't exist",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
