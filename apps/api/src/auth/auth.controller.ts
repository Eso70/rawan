import { ApiEndpoint } from '../contracts/api-endpoint.js';
import { AuthResponseDto } from '../contracts/response.dto.js';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { GoogleLoginDto } from './dto/google-login.dto.js';
import { GoogleAuthService } from './google-auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleAuth: GoogleAuthService,
  ) {}

  @ApiEndpoint({ tag: 'Auth', model: AuthResponseDto, public: true })
  @Post('google')
  @HttpCode(HttpStatus.OK)
  google(@Body() dto: GoogleLoginDto) {
    return this.googleAuth.login(dto);
  }

  @ApiEndpoint({ tag: 'Auth', model: AuthResponseDto, public: true })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiEndpoint({ tag: 'Auth', model: AuthResponseDto, public: true })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
