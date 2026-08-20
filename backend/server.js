import app from "./src/app.js"
import connectDB from "./src/config/dataBase.js"
connectDB();
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server Running on port ${PORT}`);
});