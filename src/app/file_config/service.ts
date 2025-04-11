import dotenv from "dotenv"
dotenv.config();
import { RES_MESSAGE, RES_STATUS, STATUS_CODE } from "../../common/satusMessageCode";
import Handler from "../../common/handler";
import path from 'path'
import fs from 'fs'

class FileConfigService {

  async createFileConfigService(req: any, res: any) {
    try {
      const token = decodeURIComponent(req.params.token);
      let value;
  
      try {
        value = await Handler.decrypt_file(token);
      } catch (error) {
        return res.status(STATUS_CODE.EC404).json(Handler.Error(RES_STATUS.E2, STATUS_CODE.EC404, 'File not found'))
      }
  
      const [path, type] = value.split("@");
      const filePath = `${process.cwd()}/public/${path}`;
  
      if (!fs.existsSync(filePath)) {
        return res.status(STATUS_CODE.EC404).json(Handler.Error(RES_STATUS.E2, STATUS_CODE.EC404, 'File not found'))
      }
  
      res.setHeader("Content-Type", type || "image/jpeg");
      res.setHeader("Content-Disposition", "inline");
      res.sendFile(filePath);

    } catch (error: any) {
      console.log('Error From Create-FileConfig:- ', error);
      return res.status(STATUS_CODE.EC500).json(Handler.Error(RES_STATUS.E2, STATUS_CODE.EC500, RES_MESSAGE.EM500))
    }
  }

}

export default new FileConfigService();
