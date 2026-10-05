import { ApiEndpoint } from '../contracts/api-endpoint.js';
import { AuthResponseDto } from '../contracts/response.dto.js';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
