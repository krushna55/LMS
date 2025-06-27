import app from "./app.js";
import dotenv from "dotenv";
import cloudinary from 'cloudinary'
import connectiontodb from "./config/db.js";
dotenv.config();

cloudinary.v2.config({
  cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
  api_key:process.env.CLOUDINARY_API_KEY,
  api_secret:process.env.CLOUDINARY_API_SECRETE
})

app.listen(process.env.PORT, async () => {
  await connectiontodb()
  console.log(`server is running on ${process.env.PORT}`);
});
