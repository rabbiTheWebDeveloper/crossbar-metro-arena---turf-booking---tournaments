import Shop from "@/model/shop.model";
import { UserModel } from "@/model/user-model";
// default export or named export

import { dbConnect } from "@/service/mongo";
import { sendVerifyEmail, sendWelcomeEmail } from "@/utlis/mail";
import bcrypt from "bcryptjs";
import slugify from "slugify";
import jwt from "jsonwebtoken";
import { DomainModel } from "@/model/domain-model";
import { ShopInfoModel } from "@/model/shopInfo-model";
const JWT_SECRET = process.env.JWT_SECRET;
function generateVerificationCode() {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 1000-9999
}
async function registerUserAndShopQuery(data) {
  await dbConnect();

  const { fullName, shopName, email, phone, password } = data;

  // Check if user exists
  const existingUser = await UserModel.findOne({ $or: [{ email }, { phone }] });
  if (existingUser) throw new Error("Email or phone already exists");

  // Check if shop exists
  const shopSlug = slugify(shopName, { lower: true, strict: true });
  const existingShop = await Shop.findOne({ shopSlug });
  if (existingShop) throw new Error("Shop name already taken");

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  const code = generateVerificationCode();
  const expiry = new Date(Date.now() + 15 * 60 * 1000);

  // Create user
  const user = new UserModel({
    fullName,
    email,
    phone,
    password: hashedPassword,
    emailVerificationCode: code,
    emailVerificationExpires: expiry,
  });

  await user.save();

  // Create shop
  const shop = new Shop({ shopName, owner: user._id });
  await shop.save();

  // Link shop to user
  user.shops.push(shop._id);
  await user.save();

  try {
    await sendVerifyEmail({ toEmail: email, fullName, code, expiry });
  } catch (error) {
    console.error("Email send failed:", error.message);
    // Optional: still continue user registration if you want
  }

  return {
    message: "Please check your email for the verification code.",
    status: 200,
    data: {
      emailVerified: user.emailVerified,
      email: user.email,
    },
  };
}

async function getUser(email) {
  await dbConnect();

  const user = await UserModel.findOne({ email }).lean();

  if (!user) {
    return {
      status: false,
      message: "User not found",
    };
  }

  return {
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    status: true,
  };
}

async function verifyEmailQuary(email, code) {
  await dbConnect();

  // 1️⃣ Find user
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new Error("User not found");
  }

  // 2️⃣ Check if already verified
  if (user.emailVerified) {
    return { success: true, message: "Email already verified" };
  }

  // 3️⃣ Validate code & expiry
  if (
    user.emailVerificationCode !== code ||
    !user.emailVerificationExpires ||
    user.emailVerificationExpires < new Date()
  ) {
    throw new Error("Invalid or expired verification code");
  }

  // 4️⃣ Update verification
  user.emailVerified = true;
  user.emailVerificationCode = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();
  await sendWelcomeEmail({
    toEmail: user.email,
    fullName: user.fullName,
  });
  return { success: true, message: "Email verified successfully" };
}

async function resendVerificationEmailQuary(email) {
  await dbConnect();

  // 1️⃣ Find user
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new Error("User not found");
  }

  // 2️⃣ Already verified?
  if (user.emailVerified) {
    return { success: true, message: "Email is already verified" };
  }

  // 3️⃣ Generate new code & expiry
  const code = generateVerificationCode();
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  // 4️⃣ Update user
  user.emailVerificationCode = code;
  user.emailVerificationExpires = expiry;
  await user.save();

  // 5️⃣ Send email again
  await sendVerifyEmail({
    toEmail: user.email,
    fullName: user.fullName,
    code,
    expiry,
  });

  return { success: true, message: "Verification email resent successfully" };
}

async function loginUserQuary(credentials) {
  await dbConnect();

  const { email, password } = credentials;

  // 1️⃣ Find user
  const user = await UserModel.findOne({ email })
    .populate("shops", "shopId shopName shopSlug") // only select necessary fields
    .lean();
  if (!user) {
    throw new Error("User not found");
  }

  // 2️⃣ Check if email is verified
  if (!user.emailVerified) {
    throw new Error("Email not verified. Please verify your email.");
  }

  // 3️⃣ Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid password");
  }

  // 4️⃣ Generate JWT token
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" } // adjust expiry as needed
  );
  const domain = await DomainModel.findOne(
    { userId: user._id, shopId: user.shops[0]._id },
    { domain_name: 1, domain_status: 1, _id: 0 }
  ).lean();
  const shopInfo = await ShopInfoModel.findOne(
    { userId: user._id, shopId: user.shops[0]._id },
    { companyLogo: 1, _id: 0 }
  ).lean();
  // 5️⃣ Return user info + token
  return JSON.parse(
    JSON.stringify({
      status: true,
      message: "Login successful",
      token: token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        shops: user.shops[0],
        domain: domain ? domain?.domain_name : null,
        shopLogo: shopInfo ? shopInfo?.companyLogo?.url : null,
      },
    })
  );
}
async function changePasswordQuery({ userId, oldPassword, newPassword }) {
  await dbConnect();

  // 1️⃣ Find user
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // 2️⃣ Verify old password
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    throw new Error("Old password is incorrect");
  }

  // 3️⃣ Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // 4️⃣ Update password
  user.password = hashedPassword;
  await user.save();

  return {
    status: true,
    message: "Password changed successfully",
  };
}
export {
  registerUserAndShopQuery,
  getUser,
  verifyEmailQuary,
  resendVerificationEmailQuary,
  loginUserQuary,
  changePasswordQuery,
};
