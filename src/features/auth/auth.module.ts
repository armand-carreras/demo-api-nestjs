import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenHandlingService } from './JWT/token-handling/token-handling.service';
import { JwtModule } from '@nestjs/jwt';
import { MailingService } from '../../common/mailing/mailing.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, TokenHandlingService, MailingService],
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
})
export class AuthModule {}
