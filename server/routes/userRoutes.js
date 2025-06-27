import { Router } from "express";
import {
  changePassword,
  forgetPassword,
  getProfile,
  login,
  logout,
  register,
  resetPassword,
  updateUser,
} from "../controller/userController.js";
import { isLoggedIn } from "../middleware/authmiddleware.js";
import upload from "../middleware/multerMiddleware.js";

const router = Router();
router.post("/register", upload.single("avatar"), register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/me", isLoggedIn, getProfile);
router.post("/reset", forgetPassword);
router.post("/reset/:resetToken", resetPassword);
router.post("/changepassword", changePassword);
router.put('/update',isLoggedIn,upload.single('avatar'),updateUser)

export default router;
