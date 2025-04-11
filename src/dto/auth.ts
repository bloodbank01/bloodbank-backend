import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class signUp {

  @IsNotEmpty()
  @IsString()
  @IsEmail({}, { message: 'Invalid Email Format!' })
  email?: string;

  @IsNotEmpty()
  @IsString()
  username?: string;

  @IsNotEmpty()
  @IsString()
  password?: string;

}

export class login {

  @IsNotEmpty()
  @IsString()
  email?: string;

  @IsNotEmpty()
  @IsString()
  password?: string;

}

export class forgotPassword {

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email?: string;

}

export class resetPassword {

  @IsNotEmpty()
  @IsString()
  token?: string;

  @IsNotEmpty()
  @IsString()
  access_token?: string;

  @IsNotEmpty()
  @IsString()
  password?: string;

}

export class emailVerify {

  @IsNotEmpty()
  @IsString()
  token?: string;

  @IsNotEmpty()
  @IsString()
  access_token?: string;

}

export class ssoLogin {

  @IsNotEmpty()
  @IsString()
  token?: string;

}