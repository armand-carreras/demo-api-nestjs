import {
  IsString,
  IsEmail,
  MinLength,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';

export class ResetPasswordDto {
  @ValidateIf((o: ResetPasswordDto) => !o.email)
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  username?: string;

  @ValidateIf((o: ResetPasswordDto) => !o.username)
  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @IsNotEmpty()
  @IsString()
  reset_code!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  new_password!: string;
}
