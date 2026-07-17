import {
  IsString,
  IsEmail,
  MinLength,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';

export class RequestPasswordResetDto {
  @ValidateIf((o: RequestPasswordResetDto) => !o.email)
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  username?: string;

  @ValidateIf((o: RequestPasswordResetDto) => !o.username)
  @IsNotEmpty()
  @IsEmail()
  email?: string;
}
