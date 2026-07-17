import {
  IsString,
  IsEmail,
  MinLength,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';

export class ResendVerificationDto {
  @ValidateIf((o: ResendVerificationDto) => !o.email)
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  username?: string;

  @ValidateIf((o: ResendVerificationDto) => !o.username)
  @IsNotEmpty()
  @IsEmail()
  email?: string;
}
