import { Module } from '@nestjs/common';
import { CitiesController } from './cities.controller';
import { CitiesService } from './cities.service';
import { CsvService } from 'src/common/csv/csv.service';

@Module({
  controllers: [CitiesController],
  providers: [CitiesService, CsvService],
  exports: [CitiesService],
})
export class CitiesModule {}
