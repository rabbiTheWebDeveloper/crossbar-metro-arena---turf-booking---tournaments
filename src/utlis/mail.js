import nodemailer from "nodemailer";

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.NEXT_PUBLIC_VERCEL_URL) return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  return "http://localhost:3000";
};

async function sendWelcomeEmail({ toEmail, fullName }) {
  // 🔹 Gmail SMTP setup
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "su31f2@gmail.com", // your Gmail
      pass: process.env.GMAIL_APP_PASSWORD, // App Password, not your normal password
    },
  });

  const mailOptions = {
    from: `"AMARDokan" <su31f2@gmail.com>`,
    to: toEmail,
    subject: "অভিনন্দন! আপনার AMARDokan অ্যাকাউন্ট ভেরিফাই হয়েছে",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #2c3e50; text-align: center;">স্বাগতম, ${fullName}! 🎉</h2>
        <p>আপনার AMARDokan অ্যাকাউন্ট সফলভাবে তৈরি এবং ভেরিফাই হয়েছে।</p>
        <p><strong>আপনার রেজিস্টার্ড ইমেইল:</strong> ${toEmail}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${getBaseUrl()}/login" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">লগইন করুন</a>
        </div>
        <p>এখন আপনি আপনার ড্যাশবোর্ডে লগইন করে আপনার দোকান পরিচালনা করতে পারবেন।</p>
        <p>কোনো সহায়তার প্রয়োজন হলে আমাদের সাথে যোগাযোগ করতে পারেন।</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="font-size: 14px; color: #666; text-align: center;">ধন্যবাদ,<br><strong>AMARDokan টিম</strong></p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

async function sendVerifyEmail({ toEmail, fullName, code, expiry }) {
  // 🔹 Gmail SMTP setup
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "su31f2@gmail.com", // your Gmail
      pass: process.env.GMAIL_APP_PASSWORD, // App Password, not your normal password
    },
  });

  const mailOptions = {
    from: `"AMARDokan" <su31f2@gmail.com>`,
    to: toEmail,
    subject: "আপনার AMARDokan ইমেইল ভেরিফিকেশন কোড",
    html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
      <h2 style="color: #2c3e50; text-align: center;">প্রিয় ${fullName},</h2>
      <p>AMARDokan-এ অ্যাকাউন্ট তৈরি করার জন্য ধন্যবাদ!</p>
      <p>আপনার ইমেইল ভেরিফাই করার জন্য নিচের <strong>৪-অঙ্কের</strong> কোডটি ব্যবহার করুন:</p>
      
      <div style="text-align: center;">
        <div style="font-size: 28px; font-weight: bold; color: #4f46e5; background: #f3f4f6; padding: 15px 30px; display: inline-block; margin: 15px 0; border-radius: 6px; letter-spacing: 5px;">
          ${code}
        </div>
      </div>
      
      <p>এই কোডটি পরবর্তী <strong>১৫ মিনিট</strong> পর্যন্ত বৈধ থাকবে।</p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${getBaseUrl()}/account-verify?email=${encodeURIComponent(toEmail)}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">ইমেইল ভেরিফাই করুন</a>
      </div>
      <p style="font-size: 14px; color: #777;">আপনি যদি এই অ্যাকাউন্টটি তৈরি না করে থাকেন, তবে এই ইমেইলটি এড়িয়ে যান।</p>
      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
      <p style="font-size: 14px; color: #666; text-align: center;">ধন্যবাদ,<br><strong>AMARDokan টিম</strong></p>
    </div>
  `,
  };

  await transporter.sendMail(mailOptions);
}

export { sendWelcomeEmail, sendVerifyEmail };
