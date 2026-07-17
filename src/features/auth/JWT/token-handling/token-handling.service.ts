import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtDto, TokenPair } from '../jwt-dto/jwt-dto.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TokenHandlingService {
  constructor(private readonly jwtService: JwtService) {}

  async generateAccessToken(jwtDto: JwtDto) {
    return this.jwtService.signAsync(jwtDto, {
      expiresIn: '15m',
    });
  }

  async generateRefreshToken(jwtDto: JwtDto) {
    return this.jwtService.signAsync(jwtDto, {
      expiresIn: '30d',
    });
  }

  async generateTokenPair(jwtDto: JwtDto): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(jwtDto),
      this.generateRefreshToken(jwtDto),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  hashRefreshToken(token: string): Promise<string> {
    return bcrypt.hash(token, 12);
  }

  async compareHashedTokens(storedHash: string, plaintextToken: string) {
    let same = false;
    try {
      same = await bcrypt.compare(plaintextToken, storedHash);
    } catch (error) {
      throw new Error('Error comparing hashed tokens' + error);
    }
    return same;
  }

  asyncVerify(token: string) {
    return this.jwtService.verifyAsync(token);
  }
}
