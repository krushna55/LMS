import jwt from "jsonwebtoken";
import AppError from "../utils/error.util.js";

export const isLoggedIn = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new AppError("Unauthenticated", 401));
  }
  const userDetails = await jwt.verify(token, process.env.JWT_SECRET);
  req.user = userDetails;
  // console.log(req.user);
  next();
};

export const authorizedRoles =
  (...roles) =>
  async (req, res, next) => {
    const currentUserRole = req.user.role;
    // console.log("in auth :", roles.includes(currentUserRole));
    // console.log("Roles:", roles);
    // console.log("User Roles:", currentUserRole);

    if (!roles.includes(currentUserRole)) {
      return next(
        new AppError("You do not have permission to access this ", 403)//forbidden
      );
    }
    next();
  };
