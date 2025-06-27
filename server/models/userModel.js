import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Name is required"],
      minLength: [5, "Name should have more than 5 characters"],
      maxLength: [50, "Name should have less than 50 characters"],
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      unique: true,
      // You can add match for email regex if needed
      match: [/.+@.+\..+/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [8, "Password should be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
    avatar: {
      public_id: {
        type: String,
      },
      secure_url: {
        type: String,
      },
    },
    forgetPasswordToken: {
      type: String,
    },
    forgetPasswordExpiry: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// userSchema.methods={
//     generateJWTToken: function(){
//       console.log("JWT_EXPIRY:", process.env.JWT_EXPIRY);
//             return jwt.sign(
//                 {
//                     id:this._id,email:this.email,subscription:this.subscription,role:this.role
//                 },
//                 process.env.JWT_SECRET ,
//                 {
//                     expiresIn:process.env.JWT_EXPIRY,
//                 }
//             )
//     },
//     comparePassword:async function(plaintextpassword){
//         return bcrypt.compare(plaintextpassword,this.password)
//     }
// }

userSchema.methods = {
  generateJWTToken: function () {
    return jwt.sign(
      {
        id: this._id,
        email: this.email,
        role: this.role,
        subscription: this.subscription,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: 7*24*60*60*1000,
      }
    );
  },
  comparePassword: async function (plaintextpassword) {
    return bcrypt.compare(plaintextpassword, this.password);
  },

  generatePasswordResetToken: async function () {
    const resetToken = crypto.randomBytes(20).toString("hex");
    const token = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    this.forgetPasswordToken = token;
    // this.forgetPasswordToken = crypto
    //     .createHash("sha256")
    //     .update(resetToken)
    //     .digest("hex");
    this.forgetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000); //15mins from now
    return resetToken;
  }
};

const User = model("User", userSchema);
export default User;
