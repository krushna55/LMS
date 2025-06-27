import nodemailer from "nodemailer";

export const sendEmail = async function (email, subject, message) {
  const transporter = nodemailer.createTransport({
    host: "smtp.mailersend.net",
    port: 587,
    secure: false,
    auth: {
      user: "MS_nEoJ9A@test-zkq340ey2x0gd796.mlsender.net",
      pass: "mssp.Xm2vhRj.z3m5jgr03vzgdpyo.gMp8Uiv",
    },
  });
// mlsn.0dbda1c5c9e5240aee6729b226f7758b3ed6b9a939e42b97540939b203751314
  const info = await transporter.sendMail({
    from: '"Anonymous Sender" officialkashyapkul@gmail.com>', // use your verified domain sender
    to: "krishnapatil5512@gmail.com",
    subject: subject,
    html: message,
  });

  console.log("✅ Message sent:", info.messageId);
};
