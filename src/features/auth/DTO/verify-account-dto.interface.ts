import {
  IsString,
  IsEmail,
  MinLength,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';

export class VerifyAccountDto {
  @ValidateIf((o: VerifyAccountDto) => !o.email)
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  username?: string;

  @ValidateIf((o: VerifyAccountDto) => !o.username)
  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @IsNotEmpty()
  @IsString()
  verification_code!: string;
}
