import { User } from "../models/user.model.js";
import { DailyHydration } from "../models/dailyHydration.model.js";

export const setupHydration = async (req, res) => {
  try {
    const { wakeTime, sleepTime, activityLevel } = req.body;

    if (!wakeTime || !sleepTime || !activityLevel) {
      return res.status(400).json({
        success: false,
        message: "All hydration fields are required",
      });
    }

    if (!["Sedentary", "Moderate", "Active"].includes(activityLevel)) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity level",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        hydration: { wakeTime, sleepTime, activityLevel },
        isOnboarded: true,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Create first daily hydration record
    const today = new Date().toISOString().split("T")[0];
    const existing = await DailyHydration.findOne({
      user: req.user.id,
      date: today,
    });

    if (!existing) {
      const baseGoal = (updatedUser.weight || 70) * 35;
      let activityBonus = 0;
      if (activityLevel === "Moderate") activityBonus = 300;
      else if (activityLevel === "Active") activityBonus = 600;

      await DailyHydration.create({
        user: req.user.id,
        date: today,
        goal: baseGoal + activityBonus,
        consumed: 0,
        streak: 0,
      });
    }

    res.status(200).json({
      success: true,
      message: "Hydration setup complete",
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

export const getTodayHydration = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split("T")[0];
    let record = await DailyHydration.findOne({ user: userId, date: today });

    if (!record) {
      // Auto-create today's record
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      const baseGoal = (user.weight || 70) * 35;
      let activityBonus = 0;
      const activityLevel = user.hydration?.activityLevel;
      if (activityLevel === "Moderate") activityBonus = 300;
      else if (activityLevel === "Active") activityBonus = 600;

      record = await DailyHydration.create({
        user: userId,
        date: today,
        goal: baseGoal + activityBonus,
        consumed: 0,
        streak: 0,
      });
    }

    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const logWater = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Amount must be a positive number" });
    }

    const today = new Date().toISOString().split("T")[0];
    let record = await DailyHydration.findOne({ user: userId, date: today });

    if (!record) {
      const user = await User.findById(userId);
      const baseGoal = (user?.weight || 70) * 35;
      let activityBonus = 0;
      const activityLevel = user?.hydration?.activityLevel;
      if (activityLevel === "Moderate") activityBonus = 300;
      else if (activityLevel === "Active") activityBonus = 600;

      record = await DailyHydration.create({
        user: userId,
        date: today,
        goal: baseGoal + activityBonus,
        consumed: 0,
        streak: 0,
      });
    }

    record.consumed += amount;
    await record.save();

    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getWeeklyHydration = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    const startDate = weekAgo.toISOString().split("T")[0];
    const endDate = today.toISOString().split("T")[0];

    const records = await DailyHydration.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    const totalConsumed = records.reduce((sum, r) => sum + r.consumed, 0);
    const avgConsumed = records.length > 0 ? Math.round(totalConsumed / records.length) : 0;

    return res.status(200).json({
      success: true,
      data: {
        records,
        avgConsumedMl: avgConsumed,
        totalDays: records.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

