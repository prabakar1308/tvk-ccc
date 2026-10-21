import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created.' })
  async register(@Body() body: any) {
    return this.authService.register(
      body.userId,
      body.password,
      body.role,
    );
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user and get JWT' })
  @ApiResponse({ status: 200, description: 'Successful login.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(
      body.userId,
      body.password,
    );
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile and account details' })
  @ApiResponse({ status: 200, description: 'Returns current user details' })
  async getMe(@Request() req: any) {
    return this.authService.getMe(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('change-password')
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  async changePassword(@Request() req: any, @Body() body: any) {
    return this.authService.changePassword(req.user.id, body);
  }
}

