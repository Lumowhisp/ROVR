import { User } from "../models/user.model";
import { DailyHydration } from "../models/dailyHydration.model";

export const createDailyHydration = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split("T")[0];
    const existing = await DailyHydration.findOne({
      user: userId,
      date: today,
    });
    if (existing) {
      return res.status(200).json(existing);
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const baseGoal = (user.weight || 0) * 35;
    let activityBonus = 0;
    const activityLevel = user.hydration?.activityLevel;
    if (activityLevel === "Moderate") {
      activityBonus = 300;
    } else if (activityLevel === "Active") {
      activityBonus = 600;
    }
    const newDailyHydration = new DailyHydration({
      user: userId,
      date: today,
      goal: baseGoal + activityBonus,
      consumed: 0,
      streak: 0,
    });
    await newDailyHydration.save();
    return res.status(201).json(newDailyHydration);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
