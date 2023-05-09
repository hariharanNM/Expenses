import mongoose from "mongoose";
mongoose.set("strictQuery", true);
let DB_URL =
  "mongodb+srv://Admin-Hari:Test123@cluster0.74haq.mongodb.net/budgetapp?retryWrites=true&w=majority";

function dbConnect() {
  mongoose
    .connect(DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("DATA BASE CONNECTED");
    })
    .catch((err) => {
      console.log(err);
      process.exit(1);
    });
}

export default dbConnect;
