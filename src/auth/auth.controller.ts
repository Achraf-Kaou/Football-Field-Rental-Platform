import { Controller, Post, Body, Get, UseGuards, Req, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) { }

  @Public()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Public()
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Tokens successfully refreshed' })
  @Post('refresh')
  async refreshTokens(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: any,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.refreshTokens(req.user.sub, refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  @Post('logout')
  async logout(@CurrentUser() user: any): Promise<{ message: string }> {
    await this.authService.logout(user.id);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return user;
  }

  // Google OAuth
  @Public()
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth login' })
  @Get('google')
  async googleAuth() {
    // Guard redirects to Google
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleAuthCallback(@Req() req: any) {
    const authResponse = await this.authService.validateOAuthUser({
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      googleId: req.user.googleId,
    });

    // Redirect to frontend with tokens
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    return `
      <html>
        <script>
          window.opener.postMessage(${JSON.stringify(authResponse)}, '${frontendUrl}');
          window.close();
        </script>
      </html>
    `;
  }

  // Facebook OAuth
  @Public()
  @UseGuards(FacebookAuthGuard)
  @ApiOperation({ summary: 'Facebook OAuth login' })
  @Get('facebook')
  async facebookAuth() {
    // Guard redirects to Facebook
  }

  @Public()
  @UseGuards(FacebookAuthGuard)
  @Get('facebook/callback')
  async facebookAuthCallback(@Req() req: any) {
    const authResponse = await this.authService.validateOAuthUser({
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      facebookId: req.user.facebookId,
    });

    // Redirect to frontend with tokens
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    return `
      <html>
        <script>
          window.opener.postMessage(${JSON.stringify(authResponse)}, '${frontendUrl}');
          window.close();
        </script>
      </html>
    `;
  }
}
