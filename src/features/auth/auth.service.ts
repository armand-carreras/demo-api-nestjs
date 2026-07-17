/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  GoneException,
  Logger,
  HttpException,
} from '@nestjs/common';

import { CreateUserDto } from './DTO/create-user-dto.interface';
import { VerifyAccountDto } from './DTO/verify-account-dto.interface';
import { ResendVerificationDto } from './DTO/resend-verification-dto.interface';
import { RequestPasswordResetDto } from './DTO/request-password-reset-dto.interface';
import { ResetPasswordDto } from './DTO/reset-password-dto.interface';
import { TokenHandlingService } from './JWT/token-handling/token-handling.service';
import { JwtDto, TokenPair } from './JWT/jwt-dto/jwt-dto.interface';
import bcrypt from 'bcrypt';
import { MailingService } from '../../common/mailing/mailing.service';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private tokenService: TokenHandlingService,
    private mailingService: MailingService,
  ) {}

  /**
   * ********************************************************
   * ***************** REGISTER *****************************
   * ********************************************************
   * @param createUserDto
   * @returns
   *
   * */
  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: createUserDto.username },
          { email: createUserDto.email },
        ],
      },
    });

    if (existingUser) {
      this.logger.warn(
        'Tried to register but username or email already exists',
      );
      throw new ConflictException('Username or email already exists');
    }
    try {
      const cryptedPass = await bcrypt.hash(createUserDto.password, 12);
      this.logger.debug('------- DEBUG ------- Register Service: Pass hashed');
      const user = await this.prisma.user.create({
        data: {
          username: createUserDto.username,
          email: createUserDto.email,
          password: cryptedPass,
          verification_code: Math.random().toString(36).substring(2, 8),
        },
      });
      this.logger.debug('------- DEBUG ------ Register Service: User Created');
      if (user.verification_code)
        await this.mailingService.validateYourEmail(
          user.verification_code,
          createUserDto.email,
          createUserDto.username,
        );
      this.logger.debug('------- DEBUG ------ Register Service: Mail sent');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        '------- Register Service: failed during DB Create or Email Sending',
        errorMessage,
      );
      throw new ConflictException(errorMessage);
    }
  }

  /**
   * *********************************************************
   * ************************ LOGIN **************************
   * *********************************************************
   * @param password
   * @param email
   * @param username
   * @returns { TokenPair }
   *
   */

  async login(
    password: string,
    email?: string,
    username?: string,
  ): Promise<TokenPair> {
    //Check if user exists
    const user = await this.findByUsernameOrEmail(email, username);
    //if not found throw unauthorized
    if (!user) {
      throw new UnauthorizedException('User not found');
    } else if (!user.is_verified) {
      throw new UnauthorizedException(
        'User is not verified please verify your account',
      );
    }
    //check if password is correct
    else {
      const valid = await bcrypt.compare(password, user.password);
      //If not raise an exception
      if (!valid) {
        throw new UnauthorizedException('Incorrect Password, try again!');
      }
      //All correct build JWT_DTO
      const JWT_DTO: JwtDto = {
        sub: user.id,
        username: user.username,
        email: user.email,
        role: 'USER',
      };
      //Generate DTO pairs
      const tokens = await this.tokenService.generateTokenPair(JWT_DTO);
      //Create new RefreshToken entrance, hasedToken for security 30d expiration
      const hashedToken = await this.tokenService.hashRefreshToken(
        tokens.refreshToken,
      );
      await this.createNewRefreshTokenRecord(user.id, hashedToken);
      //both unencrypted tokens are sent to client for it to store them.
      return tokens;
    }
  }

  /**
   * *************************************************************************
   * *********************** REFRESH TOKEN ***********************************
   * *************************************************************************
   * @param refreshToken
   * @returns {TokenPair}
   */
  async refreshTokenLogin(refreshToken: string): Promise<TokenPair | null> {
    const payload = await this.tokenService.asyncVerify(refreshToken);

    const storedTokens = await this.prisma.refreshToken.findMany({
      where: {
        user_id: payload.sub,
        revoked: false,
        expires_at: { gt: new Date() },
      },
      include: {
        user: true,
      },
    });

    let matchedToken: (typeof storedTokens)[number] | undefined;
    for (const token of storedTokens) {
      if (await bcrypt.compare(refreshToken, token.token_hash)) {
        matchedToken = token;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException(
        'Try logging in with your credentials again token is malformed or might be expired',
      );
    }

    const jwtPayload: JwtDto = {
      sub: matchedToken.user.id,
      username: matchedToken.user.username,
      email: matchedToken.user.email,
      role: matchedToken.user.role,
    };

    const newPair = await this.tokenService.generateTokenPair(jwtPayload);
    const hashedRefreshToken = await this.tokenService.hashRefreshToken(
      newPair.refreshToken,
    );

    await this.prisma.refreshToken.update({
      where: { id: matchedToken.id },
      data: { replaced_by: hashedRefreshToken, revoked: true },
    });
    await this.createNewRefreshTokenRecord(
      matchedToken.user_id,
      hashedRefreshToken,
    );

    return newPair;
  }

  /**
   * *************************************************************************
   * *********************** VERIFY ACCOUNT **********************************
   * *************************************************************************
   * @param verifyAccountDto
   * @returns success message
   */
  async verifyAccount(verifyAccountDto: VerifyAccountDto) {
    const user = await this.findByUsernameOrEmail(
      verifyAccountDto.email,
      verifyAccountDto.username,
    );

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.is_verified) {
      throw new ConflictException('Account is already verified');
    }

    if (user.verification_code !== verifyAccountDto.verification_code) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        is_verified: true,
        verification_code: null,
      },
    });

    return { message: 'Account verified successfully. You can now log in.' };
  }

  /**
   * *************************************************************************
   * *********************** RESEND VERIFICATION CODE ************************
   * *************************************************************************
   * @param resendVerificationDto
   * @returns success message
   */
  async resendVerificationCode(resendVerificationDto: ResendVerificationDto) {
    const user = await this.findByUsernameOrEmail(
      resendVerificationDto.email,
      resendVerificationDto.username,
    );

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.is_verified) {
      throw new BadRequestException('Account is already verified');
    }
    const newCode = Math.random().toString(36).substring(2, 8);

    try {
      //User UPDATE verification Code
      this.logger.debug(
        '------- DEBUG ------- resendVerificationCode: DB and mail sending',
      );
      await this.prisma.user.update({
        where: { id: user.id },
        data: { verification_code: newCode },
      });
      // Send new Verification code after updating
      this.logger.debug(
        '------- DEBUG ------- resendVerificationCode: DB updated',
      );
      await this.mailingService.validateYourEmail(
        newCode,
        user.email,
        user.username,
      );
      this.logger.debug(
        '------- DEBUG ------- resendVerificationCode: mail sent',
      );
    } catch (error) {
      this.logger.error(
        '------- resendVerificationCode Service: failed during DB Update or Email Sending',
      );
      throw new ConflictException(
        'Error during User update or email service' + error,
      );
    }
  }

  /**
   * *************************************************************************
   * *********************** REQUEST PASSWORD RESET **************************
   * *************************************************************************
   * @param requestPasswordResetDto
   * @returns success message
   */
  async requestPasswordReset(requestPasswordResetDto: RequestPasswordResetDto) {
    const user = await this.findByUsernameOrEmail(
      requestPasswordResetDto.email,
      requestPasswordResetDto.username,
    );

    if (!user) {
      // Don't reveal whether the user exists
      return {
        message: 'If the account exists, a password reset code has been sent.',
      };
    }

    const resetCode = Math.random().toString(36).substring(2, 8);

    try {
      this.logger.debug('------ DEBUG ----- User Transaction StartPoint');
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          reset_code: resetCode,
          reset_code_expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        },
      });
      this.logger.debug('------ DEBUG ----- Email Sending StartPoint');
      await this.mailingService.passwordResetEmail(
        resetCode,
        user.email,
        user.username,
      );
      this.logger.debug('------ DEBUG ----- Pass recovery sent');
    } catch (error) {
      this.logger.error('error when trying to reset pass', error);
      throw new HttpException('User not updated, something has failed', 503);
    }
    return {
      message: 'If the account exists, a password reset code has been sent.',
    };
  }

  /**
   * *************************************************************************
   * *********************** RESET PASSWORD **********************************
   * *************************************************************************
   * @param resetPasswordDto
   * @returns success message
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.findByUsernameOrEmail(
      resetPasswordDto.email,
      resetPasswordDto.username,
    );

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.reset_code || !user.reset_code_expires_at) {
      throw new BadRequestException('No password reset has been requested');
    }

    if (user.reset_code !== resetPasswordDto.reset_code) {
      throw new BadRequestException('Invalid reset code');
    }

    if (new Date() > user.reset_code_expires_at) {
      throw new GoneException(
        'Reset code has expired. Please request a new one.',
      );
    }

    try {
      const hashedPassword = await bcrypt.hash(
        resetPasswordDto.new_password,
        12,
      );
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          reset_code: null,
          reset_code_expires_at: null,
        },
      });
    } catch (error) {
      this.logger.error('error when trying to reset pass', error);
      throw new HttpException('User not updated, something has failed', 503);
    }

    return { message: 'Password has been reset successfully.' };
  }

  /**
   * *******************************************************************
   * ********************* Helper Methods ******************************
   * *******************************************************************
   */

  private async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
  private async findByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }
  private async findByUsernameOrEmail(email?: string, username?: string) {
    if (username) return await this.findByUsername(username);
    else if (email) return await this.findByEmail(email);
    else throw new BadRequestException('Username or Email must be provided');
  }

  private async createNewRefreshTokenRecord(
    user_id: number,
    hashedToken: string,
  ) {
    await this.prisma.refreshToken.create({
      data: {
        token_hash: hashedToken,
        user_id: user_id,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  /*   private async cleanupExpiredRefreshTokens() {
    await this.prisma.refreshToken.deleteMany({
      where: {
        expires_at: {
          lte: new Date(), //Less Than or Equal: new Date()
        },
      },
    });
  } */
}
