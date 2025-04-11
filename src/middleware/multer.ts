import multer from "multer";
import dotenv from "dotenv";
import fs from "fs";
import Handler from "../common/handler";
import { RES_STATUS, STATUS_CODE } from "../common/satusMessageCode";
dotenv.config();

const generateFileName = (prefix: string, file: Express.Multer.File): string => {
  try {
    const fileExtension = file.originalname.split(".").pop();
    return `${Date.now()}-${prefix}.${fileExtension}`;
  } catch (error) {
    console.error("Error Generating File Name:", error);
    return `${Date.now()}-${prefix}.unknown`; // Fallback filename
  }
};

const createStorage: any = (folder: string) => {
  try {
    const path = `${process.cwd()}/public/${folder}`;
    try {
      console.log("🚀 ~ dir:", path)
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
        console.log("Directory created:", path);
      }
    } catch (error) {
      console.error("Error creating directory:", error);
      throw new Error("Failed to create required directory!");
    }

    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path);
      },
      filename: async (req, file, cb) => {
        const file_name: string = generateFileName(folder, file);
        cb(null, file_name);
      },
    });
  } catch (error) {
    console.error("Error Creating Storage:", error);
    throw new Error("Failed To Initialize Storage!");
  }
};

const uploadMiddleware = (uploadHandler: any, folder: string) => {

  return (req: any, res: any, next: any) => {
    uploadHandler(req, res, async (err: any) => {
      if (err) {
        console.error("Multer Upload Error:", err);
        return res
          .status(STATUS_CODE.EC400)
          .json(Handler.Error(RES_STATUS.E2, STATUS_CODE.EC400, "File Not Uploaded!"));
      }
      if (req.file) {
        let extension = await Handler.getFileExtension(req.file.filename);
        req.file.key = encodeURIComponent(await Handler.encrypt_file(`${folder}/${req.file.filename}@${extension}`));
        console.log("File uploaded successfully. Key added to req.file:", req.file.key);
      }
      next();
    });
  };
};

const upload_profile = uploadMiddleware(multer({ storage: createStorage("profile") }).single("file"), "profile");
export { upload_profile };