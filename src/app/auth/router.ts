import express from 'express'
import AuthService from './service'
import dtoValidationMiddleware from '../../middleware/validation';
import { emailVerify, forgotPassword, login, resetPassword, signUp, ssoLogin } from '../../dto/auth';
import { RES_MESSAGE, RES_STATUS, STATUS_CODE } from '../../common/satusMessageCode';
import Handler from '../../common/handler';
import handleAuthorization from '../../middleware/handleAuthorization';

class AuthRouterClass {
  public router = express.Router();

  constructor() {
    this.initializeRoutes();
  }

  private async signUp(req: any, res: any): Promise<void> {
    try {
      const result = await AuthService.signUpService(req);
      res.status(result?.success?.statusCode || result?.error?.statusCode).json(result);
    } catch (error: any) {
      res.status(STATUS_CODE.EC500).json(Handler.Error(RES_STATUS.E2, STATUS_CODE.EC500, RES_MESSAGE.EM500));
    }
  }

  private async emailVerify(req: any, res: any): Promise<void> {
    try {
      const result = await AuthService.emailVerifyService(req);
      res.status(result?.success?.statusCode || result?.error?.statusCode).json(result);
    } catch (error: any) {
      res.status(STATUS_CODE.EC500).json(Handler.Error(RES_STATUS.E2, STATUS_CODE.EC500, RES_MESSAGE.EM500));
    }
  }

  private async login(req: any, res: any): Promise<void> {
    try {
      const result = await AuthService.loginService(req);
      res.status(result?.success?.statusCode || result?.error?.statusCode).json(result);
    } catch (error: any) {
      res.status(STATUS_CODE.EC500).json(Handler.Error(RES_STATUS.E2, STATUS_CODE.EC500, RES_MESSAGE.EM500));
    }
  }

  private async forgotPassword(req: any, res: any): Promise<void> {
    try {
      const result = await AuthService.forgotPasswordService(req);
      res.status(result?.success?.statusCode || result?.error?.statusCode).json(result);
    } catch (error: any) {
      res.status(STATUS_CODE.EC500).json(Handler.Error(RES_STATUS.E2, STATUS_CODE.EC500, RES_MESSAGE.EM500));
    }
  }

  private async resetPassword(req: any, res: any): Promise<void> {
    try {
      const result = await AuthService.resetPasswordService(req);
      res.status(result?.success?.statusCode || result?.error?.statusCode).json(result);
    } catch (error: any) {
      res.status(STATUS_CODE.EC500).json(Handler.Error(RES_STATUS.E2, STATUS_CODE.EC500, RES_MESSAGE.EM500));
    }
  }

  private async logout(req: any, res: any): Promise<void> {
    try {
      const result = await AuthService.logoutService(req);
      res.status(result?.success?.statusCode || result?.error?.statusCode).json(result);
    } catch (error:any) {
      res.status(STATUS_CODE.EC500).json(Handler.Error(RES_STATUS.E2, STATUS_CODE.EC500, RES_MESSAGE.EM500));
    }
  }

  private async ssoLogin(req: any, res: any): Promise<void> {
    try {
      const result = await AuthService.ssoLoginService(req);
      res.status(result?.success?.statusCode || result?.error?.statusCode).json(result);
    } catch (error:any) {
      res.status(STATUS_CODE.EC500).json(Handler.Error(RES_STATUS.E2, STATUS_CODE.EC500, RES_MESSAGE.EM500));
    }
  }

  private initializeRoutes(): void {
    this.router.post("/sign-up", dtoValidationMiddleware(signUp), this.signUp)
    this.router.post("/email-verify", dtoValidationMiddleware(emailVerify), this.emailVerify)
    this.router.post("/sign-in", dtoValidationMiddleware(login), this.login)
    this.router.post("/forgot-password", dtoValidationMiddleware(forgotPassword), this.forgotPassword)
    this.router.post("/reset-password", dtoValidationMiddleware(resetPassword), this.resetPassword)
    this.router.get("/logout", handleAuthorization, this.logout)

    //sso
    this.router.post('/google-sign-in',  dtoValidationMiddleware(ssoLogin), this.ssoLogin)
    // this.router.post('/google/callback',  dtoValidationMiddleware(ssoLogin), this.ssoLogin)
  }
}

export default new AuthRouterClass().router;
