import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config();

export const sendEmail = async (to: string, subject: string, html: any) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT), // 587
      service: 'gmail',
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Bloodbank" <${process.env.MAIL_USER}>`,
      to: to,
      subject: subject,
      ...(html && { html }),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);

    return { status: true, data: info.response }
  } catch (error) {
    console.error("Error sending email:", error);
    return { status: false }
  }
};
