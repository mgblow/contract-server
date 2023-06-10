import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignupDto } from "./dto/signup.dto";
import { VerifyDto } from "./dto/verify.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {
  }

  @Post("/entry")
  entry(@Body() signupDto: SignupDto) {
    return this.authService.entry(signupDto);
  }

  @Post("/verify")
  verify(@Body() verifyDto: VerifyDto) {
    return this.authService.verify(verifyDto);
  }
}
