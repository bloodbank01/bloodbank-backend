import dotenv from "dotenv"
dotenv.config();
import { RES_MESSAGE, RES_STATUS, STATUS_CODE } from "../../common/satusMessageCode";
import bcrypt from 'bcrypt'
import { Users } from "../../models/users";
import Handler from "../../common/handler";
import { Login_History } from "../../models/login_history";
import { sendEmail } from "../../common/sendMail";
import { forgotPasswordEmail, registrationEmail } from "../../common/emailTemplates";
let soultRoute: number = 10
import { OAuth2Client } from 'google-auth-library';
// Your Google Client ID
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);
import axios from 'axios'

class AuthService {

  async generateRandomString(length: number = 10) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  async signUpService(req: any) {
    try {

      const { email, username } = req.body

      const validPass = await Handler.validatePassword(req.body.password)

      if (!validPass.status) {
        return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC400, validPass.message)
      }

      const exitUser = await Users.findOne({ where: { email, is_active: true } })
      const exitUsername = await Users.findOne({ where: { username, is_active: true } })

      if (exitUser || exitUsername) {
        return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC409, "An Account With This Email or Username Already Exists!")
      }

      let enPass = await bcrypt.hash(req.body.password, soultRoute)

      const user = await Users.create({ ...req.body, password: enPass })
      const accessToken = await this.generateRandomString(10)
      console.log("🚀 ~ AuthService ~ signUpService ~ accessToken:", accessToken)
      const token = await Handler.generateToken({ id: user.dataValues.id, email: user.dataValues.email, verification_token: accessToken }, null)
      let url: string = `${process.env.WEB_LINK}email-verify?token=${encodeURIComponent(token)}&accessToken=${accessToken}`

      let html: any = await registrationEmail({ url })
      const result: any = await sendEmail(email, 'Registration', html)

      if (!result.status) {
        return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC400, "Failed To Send Registration Email!")
      }
      return Handler.Success(RES_STATUS.E1, STATUS_CODE.EC200, "A Verification Email Has Been Sent. Please Verify To Login!", null)

    } catch (error: any) {
      console.log('Error From Sign-Up:- ', error)
      return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC500, RES_MESSAGE.EM500)
    }
  }

  async emailVerifyService(req: any) {
    try {

      const { token, access_token } = req.body

      const token_verify = await Handler.verifyToken(token)

      if (!token_verify) {
        return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC401, "Link Expire!")
      }

      const { email, id, verification_token } = token_verify

      if (access_token != verification_token) {
        return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC403, "Access Token Mistmatch!")
      }

      const exists_user = await Users.findOne({ where: { id, email, is_active: true } })

      if (!exists_user) {
        return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC400, "An Account With This Email Does Not Exist!")
      }

      if (exists_user.dataValues.is_email_verified) {
        return Handler.Success(RES_STATUS.E1, STATUS_CODE.EC200, "Email Already Verified!", { status: true })
      }

      await Users.update({ is_email_verified: true }, { where: { id, email } })

      return Handler.Success(RES_STATUS.E1, STATUS_CODE.EC200, "Email Verified Successfully!", { status: true })

    } catch (error: any) {
      console.log('Error From Email-Verify:- ', error)
      return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC500, RES_MESSAGE.EM500)
    }
  }

  async loginService(req: any) {
    try {

      const { email, password } = req.body

      const exitUser: any = await Users.findOne({ where: { email, is_active: true } })

      if (!exitUser) {
        return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC404, "An Account With This Email Does Not Exist!")
      }

      if (!exitUser.is_email_verified) {
        return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC401, "Email Not Verified Please Verify To Login!")
      }

      if(!exitUser?.dataValues?.password){
        return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC400, "Please Forgot Your Password!")
      }

      let dPass = await bcrypt.compare(password, exitUser?.dataValues?.password)

      if (!dPass) {
        return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC401, "The Password You Entered Is Incorrect!")
      }

      if (exitUser.dataValues.login_token != null) {
        const decode = await Handler.verifyToken(exitUser.dataValues.login_token)

        if (decode) {
          return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC409, "Oops! You’re Already Logged In On Another Device!")
        }
      }

      let vr = await this.generateRandomString()
      const token = await Handler.generateToken({ ...exitUser.dataValues, vr }, '24h')

      await Users.update({ login_token: token, vr }, { where: { id: exitUser.dataValues.id } })

      let history_data: any = { user_id: exitUser.dataValues.id, email: exitUser.dataValues.email, login_token: token, vr }
      await Login_History.create(history_data)

      return Handler.Success(RES_STATUS.E1, STATUS_CODE.EC200, "Login Successfully!", { jwt: token, vr, user: { id: exitUser.dataValues.id } })

    } catch (error: any) {
      console.log('Error From Login:- ', error)
      return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC500, RES_MESSAGE.EM500)
    }
  }

  async forgotPasswordService(req: any) {
    try {

      const { email } = req.body

      const exitUser: any = await Users.findOne({ where: { email, is_active: true } })

      if (!exitUser) {
        return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC404, "An Account With This Email Does Not Exist!")
      }

      if (!exitUser.is_email_verified) {
        return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC401, "Email Not Verified. Please First Verify Your Email!")
      }

      const accessToken = await this.generateRandomString(10)
      const token = await Handler.generateToken({ id: exitUser.dataValues.id, email: exitUser.dataValues.email, verification_token: accessToken }, '2m')
      console.log("🚀 ~ AuthService ~ signUpService ~ accessToken:", accessToken)
      let url: string = `${process.env.WEB_LINK}reset-password?token=${encodeURIComponent(token)}&accessToken=${accessToken}`

      let html: any = await forgotPasswordEmail({ url })
      const result: any = await sendEmail(email, 'Forgot Password', html)

      if (!result.status) {
        return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC400, "Failed To Send Forgot Password Email!")
      }

      return Handler.Success(RES_STATUS.E1, STATUS_CODE.EC200, "A Forgot Password Email Has Been Sent. Please Check Your Email.", null)

    } catch (error: any) {
      console.log('Error From Sent-Forgot-Password-Email:- ', error)
      return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC500, RES_MESSAGE.EM500)
    }
  }

  async resetPasswordService(req: any) {
    try {

      const { token, password, access_token } = req.body

      const decode = await Handler.verifyToken(token)

      if (!decode) {
        return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC401, "Link Expire!")
      }

      const { verification_token } = decode

      if (access_token != verification_token) {
        return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC403, "Access Token Mistmatch!")
      }

      const validPass = await Handler.validatePassword(password)

      if (!validPass.status) {
        return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC400, validPass.message)
      }

      const exitUser: any = await Users.findOne({ where: { id: decode.id, email: decode.email, is_active: true } })

      if (!exitUser) {
        return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC404, "An Account With This Email Does Not Exist!")
      }

      if (!exitUser.is_email_verified) {
        return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC401, "Email Not Verified. Please First Verify Your Email!")
      }

      let enPass = await bcrypt.hash(password, soultRoute)
      await Users.update({ password: enPass }, { where: { id: decode.id, email: decode.email, is_active: true } })

      return Handler.Success(RES_STATUS.E1, STATUS_CODE.EC200, "Password Updated!", null)

    } catch (error: any) {
      console.log('Error From Reset-Password:- ', error)
      return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC500, RES_MESSAGE.EM500)
    }
  }

  async logoutService(req: any) {
    try {

      const token: any = await req.header('Authorization')?.replace('Bearer ', '');
      const { userId } = req

      const exitUser: any = await Users.findOne({ where: { id: userId } })

      if (!exitUser) {
        return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC404, "An Account With This Email Does Not Exist!")
      }

      let history_data: any = { user_id: exitUser.dataValues.id, email: exitUser.dataValues.email, login_token: token, type: 'Logout', ip: req.user_ip }
      await Login_History.create(history_data)

      if (!exitUser.login_token) {
        return Handler.Success(RES_STATUS.E1, STATUS_CODE.EC200, "You Have Already Logged Out!", null)
      }

      await exitUser.update({ login_token: null, vr: null })

      return Handler.Success(RES_STATUS.E1, STATUS_CODE.EC200, "Logout Successfully!", null)

    } catch (error: any) {
      console.log('Error From Logout:- ', error)
      return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC500, RES_MESSAGE.EM500)
    }
  }

  async validateGoogleToken(accessToken: string) {
    try {
      // Step 1: Validate token
      const tokenInfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/tokeninfo', {
        params: { access_token: accessToken },
      });

      const tokenInfo = tokenInfoRes.data;

      if (tokenInfo.aud !== CLIENT_ID) {
        return { status: false, message: "Invalid Client Id!" }
      }

      // Step 2: Get user info
      const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const user = userInfoRes.data;
      return { status: true, message: "Data Fetch Successfully!", data: { email: user.email, name: user.name, picture: user.picture, sub: user.id } };

    } catch (error: any) {
      console.error('Google token validation failed:', error.message);
      return { status: false, message: "Invalid Or Expired Google Access Token!" }
    }
  };

  async ssoLoginService(req: any) {
    try {
      let { token } = req.body
      // Verify the token using Google's OAuth2 client
      // const ticket = await client.verifyIdToken({
      //   idToken: token,
      //   audience: CLIENT_ID,
      // });

      // Get user details from the token
      // const payload = ticket.getPayload();

      const {data, status, message} = await this.validateGoogleToken(token)

      if(!status){
        return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC400, message)
      }

      if (data) {
        const { email, name } = data as { email: string, name: string };

        let user: any = await Users.findOne({ where: { email } })

        if (!user) {

          let obj: any = {
            username: name,
            email,
            is_email_verified: 1
          }
          let createUser = await Users.create(obj)
        }

        const exitUser = await Users.findOne({ where: { email } })

        if (!exitUser) {
          return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC403, "An Account With This Email Does Not Exist!")
        }

        if (!exitUser.is_email_verified) {
          return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC401, "Email Not Verified Please Verify To Login!")
        }

        if (exitUser.dataValues.login_token != null) {
          const decode = await Handler.verifyToken(exitUser.dataValues.login_token)

          if (decode) {
            return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC409, "Oops! You’re Already Logged In On Another Device!")
          }
        }

        let vr = await this.generateRandomString()
        const token = await Handler.generateToken({ ...exitUser.dataValues, vr }, '24h')

        await Users.update({ login_token: token, vr }, { where: { id: exitUser.dataValues.id } })

        let history_data: any = { user_id: exitUser.dataValues.id, email: exitUser.dataValues.email, login_token: token, vr }
        await Login_History.create(history_data)

        return Handler.Success(RES_STATUS.E1, STATUS_CODE.EC200, "Login Successfully!", { jwt: token, vr, user: { id: exitUser.dataValues.id } })

      } else {
        return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC400, "Invalid Token!")
      }
    } catch (error: any) {
      console.log('Error From SSO-Login:- ', error)
      return Handler.Error(RES_STATUS.E2, STATUS_CODE.EC500, RES_MESSAGE.EM500)
    }
  }

}

export default new AuthService();
