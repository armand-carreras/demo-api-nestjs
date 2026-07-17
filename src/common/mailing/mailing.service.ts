import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SentMessageInfo } from 'nodemailer';

export interface SendEmailDto {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  attachments?: any[];
}

@Injectable()
export class MailingService {
  private readonly logger = new Logger(MailingService.name);

  constructor(private readonly mailerService: MailerService) {}

  sendEmail(dto: SendEmailDto): Promise<SentMessageInfo> {
    return this.mailerService.sendMail({
      to: dto.to,
      cc: dto.cc,
      bcc: dto.bcc,
      subject: dto.subject,
      html: dto.html,
      text: dto.text,
      replyTo: dto.replyTo,
      attachments: dto.attachments,
    });
  }

  validateYourEmail(
    verification_code: string,
    email: string,
    username: string,
  ) {
    const subject = 'Verify your email address - ACL Code Solutions';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, Helvetica, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
            <tr>
              <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #28D7FF 0%, #2CFF9B 100%); padding: 40px 20px; text-align: center;">
                      <h2 style="color: #ffffff; margin: 0; font-size: 28px;">ACL Code Solutions</h2>
                      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 16px;">Email Verification</p>
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="font-size: 16px; color: #333333; margin: 0 0 20px;">Hello <strong>${username}</strong>,</p>
                      <p style="font-size: 15px; color: #555555; line-height: 1.6; margin: 0 0 20px;">
                        Thank you for creating an account with AclCodeSolutions! To complete your registration,
                        please use the verification code below:
                      </p>
                      <!-- Verification Code -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="background-color: #f8f9ff; border-radius: 8px; padding: 25px; margin-bottom: 20px;">
                            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #28D7FF; font-family: 'Courier New', monospace;">
                              ${verification_code}
                            </span>
                          </td>
                        </tr>
                      </table>
                      <p style="font-size: 14px; color: #777777; line-height: 1.5; margin: 20px 0 0;">
                        This code will expire shortly. If you did not request this verification, please ignore this email.
                      </p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9ff; padding: 20px 30px; text-align: center; border-top: 1px solid #e8e8e8;">
                      <p style="font-size: 12px; color: #999999; margin: 0;">
                        &copy; ${new Date().getFullYear()} ACL Code Solutions. All rights reserved.<br>
                        This is an automated message, please do not reply directly.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  passwordResetEmail(reset_code: string, email: string, username: string) {
    const subject = 'Reset your password - ACL Code Solutions';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, Helvetica, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
            <tr>
              <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #28D7FF 0%, #2CFF9B 100%); padding: 40px 20px; text-align: center;">
                      <h2 style="color: #ffffff; margin: 0; font-size: 28px;">ACL Code Solutions</h2>
                      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 16px;">Password Reset</p>
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="font-size: 16px; color: #333333; margin: 0 0 20px;">Hello <strong>${username}</strong>,</p>
                      <p style="font-size: 15px; color: #555555; line-height: 1.6; margin: 0 0 20px;">
                        We received a request to reset the password for your AclCodeSolutions account. 
                        Use the reset code below to set a new password:
                      </p>
                      <!-- Reset Code -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="background-color: #f8f9ff; border-radius: 8px; padding: 25px; margin-bottom: 20px;">
                            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #28D7FF; font-family: 'Courier New', monospace;">
                              ${reset_code}
                            </span>
                          </td>
                        </tr>
                      </table>
                      <p style="font-size: 14px; color: #777777; line-height: 1.5; margin: 20px 0 0;">
                        This code will expire shortly. If you did not request a password reset, please ignore this email 
                        and your password will remain unchanged.
                      </p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9ff; padding: 20px 30px; text-align: center; border-top: 1px solid #e8e8e8;">
                      <p style="font-size: 12px; color: #999999; margin: 0;">
                        &copy; ${new Date().getFullYear()} ACL Code Solutions. All rights reserved.<br>
                        This is an automated message, please do not reply directly.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }
}
