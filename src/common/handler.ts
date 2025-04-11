import { RES_STATUS } from "./satusMessageCode";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
import moment from "moment";
dotenv.config()
//@ts-ignore
const crypto = require('crypto');
let secretKey = process.env.SECRET_KEY || 'secrateKey';
let ecy_algo = process.env.ECY_ALGO
let ecy_key = process.env.ECY_KEY
let ecy_iv = process.env.ECY_IV

let file_ecy_algo = process.env.FILE_ECY_ALGO
let file_ecy_key = process.env.FILE_ECY_KEY
let file_ecy_iv = process.env.FILE_ECY_IV


export default class Handler {

  static Success(status: boolean, statusCode: number, message: string, data: any): any {

    return {
      success: {
        status: status,
        statusCode: statusCode,
        message
      },
      data: data,
      error: null
    };

  }

  static Error(status: boolean, statusCode: number, err?: string): any {
    const res: any = {
      success: null,
      data: null,
      error: {
        status,
        statusCode,
        message: err || 'Something Went To Wrong!'
      }
    };
    return res;
  }

  static async generateToken(payload: any, expiresIn: any): Promise<string> {
    let token = await expiresIn ? this.encrypt(jwt.sign(payload, secretKey, { expiresIn: expiresIn })) : this.encrypt(jwt.sign(payload, secretKey))
    console.log('generate token', encodeURIComponent(token))
    return encodeURIComponent(token);
  };

  static async verifyToken(token: string) {
    try {
      let decryptToken = await this.decrypt(decodeURIComponent(token))
      console.log(decryptToken, 'de token')
      const decoded: any = jwt.verify(decryptToken, secretKey);
      return decoded;
    } catch (error: any) {
      console.log('Invalid or Expired Token:', error.message);
      return null;
    }
  };

  static encrypt = (input_data: any) => {
    let cipher = crypto.createCipheriv(ecy_algo, ecy_key, ecy_iv);
    let encrypted = cipher.update(input_data, "utf8", "base64");
    encrypted += cipher.final("base64");
    return encrypted;
  };

  static decrypt = (input_data: any) => {
    let decipher = crypto.createDecipheriv(ecy_algo, ecy_key, ecy_iv);
    let decrypted = decipher.update(input_data, "base64", "utf8");
    return decrypted + decipher.final("utf8");
  };

  static encrypt_file = (input_data: any) => {
    let cipher = crypto.createCipheriv(file_ecy_algo, file_ecy_key, file_ecy_iv);
    let encrypted = cipher.update(input_data, "utf8", "base64");
    encrypted += cipher.final("base64");
    return encrypted;
  };

  static decrypt_file = (input_data: any) => {
    let decipher = crypto.createDecipheriv(file_ecy_algo, file_ecy_key, file_ecy_iv);
    let decrypted = decipher.update(input_data, "base64", "utf8");
    return decrypted + decipher.final("utf8");
  };

  static async capitalizeFirstLetter(str: string): Promise<string> {
    return str.toLowerCase().split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  }

  static async dateFormate(date: any) {
    if (date && date != null && date != "") {
      let date_formate = moment(date, ["DD-MM-YYYY", "MM-DD-YYYY", "YYYY-DD-MM", "YYYY-MM-DD"], true).isValid() ? moment(date, ["DD-MM-YYYY", "MM-DD-YYYY", "YYYY-DD-MM", "YYYY-MM-DD"]).format("YYYY-MM-DD") : null;
      return date_formate
    }

    return null
  }

  static async getFileExtension(filename: any) {

    if (!filename) {
      return null
    }

    const ext = filename.split('.').pop().toLowerCase();
    const videoExtensions = ["mp4", "mkv", "avi", "mov", "wmv", "flv", "webm", "mpeg"];

    return videoExtensions.includes(ext) ? `video/${ext}` : `image/${ext}`;
  }

  static async validatePassword(password: string) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,40}$/;
    const result = regex.test(password);

    if (!result) {
      return { status: RES_STATUS.E2, message: 'Password should contain one capital , one small letters , one special character ,and it should have mini 8 characters and max 40' }
    }

    return { status: true }
  }

  static async removeDuplicateArrayElement(array:object[]){

    return [...new Map(array.map((obj) => [JSON.stringify(obj), obj])).values(),]

  }

}