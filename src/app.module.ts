import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './features/auth/auth.module';
import { CitiesModule } from './features/cities/cities.module';
import { DatabaseModule } from './database/database.module';
import { MailingService } from './common/mailing/mailing.service';

@Module({
  imports: [ConfigModule.forRoot(), AuthModule, CitiesModule, DatabaseModule],
  controllers: [AppController],
  providers: [AppService, MailingService],
})
export class AppModule {}
