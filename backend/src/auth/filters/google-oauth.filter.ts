import { ArgumentsHost, Catch, ExceptionFilter, HttpException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Catch()
export class GoogleOAuthFilter implements ExceptionFilter {
    constructor(private configService: ConfigService) { }

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = exception instanceof HttpException ? exception.getStatus() : 500;

        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

        const html = `
      <html>
        <script>
          window.opener.postMessage(
            { 
              error: 'Authentication failed', 
              message: '${exception.message}' 
            }, 
            '${frontendUrl}'
          );
          window.close();
        </script>
      </html>
    `;

        response.status(status).send(html);
    }
}
