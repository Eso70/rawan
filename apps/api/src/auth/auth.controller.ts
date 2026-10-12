import { ApiEndpoint } from '../contracts/api-endpoint.js';
import { AuthResponseDto } from '../contracts/response.dto.js';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { GoogleLoginDto } from './dto/google-login.dto.js';
import { GoogleAuthService } from './google-auth.service.js';
import { EmailSignupService } from './email-signup.service.js';
import {
  EmailSignupDto,
  EmailVerificationDto,
  EmailVerificationIdDto,
  EmailChallengeResponse,
} from './email-signup.dto.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleAuth: GoogleAuthService,
    private readonly emailSignup: EmailSignupService,
  ) {}

  @ApiEndpoint({ tag: 'Auth', model: AuthResponseDto, public: true })
  @Post('google')
  @HttpCode(HttpStatus.OK)
  google(@Body() dto: GoogleLoginDto) {
    return this.googleAuth.login(dto);
  }

  @ApiEndpoint({
    tag: 'Auth',
    model: AuthResponseDto,
    public: true,
    deprecated: true,
    description:
      'Retired direct registration. Email accounts require the signup and verify endpoints.',
  })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiEndpoint({
    tag: 'Auth',
    model: EmailChallengeResponse,
    public: true,
    description:
      'Request an eight-digit email confirmation code. No account or session exists until verification. SMTP must be configured.',
  })
  @Post('email/signup')
  @HttpCode(HttpStatus.ACCEPTED)
  emailStart(@Body() dto: EmailSignupDto) {
    return this.emailSignup.start(dto);
  }

  @ApiEndpoint({
    tag: 'Auth',
    model: EmailChallengeResponse,
    public: true,
    description:
      'Rotate and resend the code after the 30-second cooldown. Five sends per email per hour.',
  })
  @Post('email/resend')
  @HttpCode(HttpStatus.ACCEPTED)
  emailResend(@Body() dto: EmailVerificationIdDto) {
    return this.emailSignup.resend(dto.verificationId);
  }

  @ApiEndpoint({
    tag: 'Auth',
    model: AuthResponseDto,
    public: true,
    description:
      'Verify an unexpired delivered code and atomically create the account. Codes are single use, with five attempts.',
  })
  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  emailVerify(@Body() dto: EmailVerificationDto) {
    return this.emailSignup.verify(dto);
  }

  @ApiEndpoint({ tag: 'Auth', model: AuthResponseDto, public: true })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
