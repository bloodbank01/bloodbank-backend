import express from 'express'
import FileConfigService from './service'

class FileConfigRouterClass {
  public router = express.Router();

  constructor() {
    this.initializeRoutes();
  }
  private initializeRoutes(): void {
    this.router.get("/:token", (req, res) => {
      FileConfigService.createFileConfigService(req, res);
    });
  }
}

export default new FileConfigRouterClass().router;
