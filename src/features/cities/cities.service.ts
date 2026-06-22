import { Injectable, NotFoundException } from '@nestjs/common';
import type { CityRecordDTO } from './DTO/city-record-dto.interface';
import { CsvService } from 'src/common/csv/csv.service';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class CitiesService {
  private readonly csvPath: string;

  constructor(private readonly csvService: CsvService) {
    // Resolve CSV path — try dist/assets first (Docker/prod), then src/assets (dev)
    const prodPath = join(process.cwd(), 'dist', 'assets', 'worldcities.csv');
    const devPath  = join(process.cwd(), 'src', 'assets', 'worldcities.csv');
    this.csvPath = existsSync(prodPath) ? prodPath : devPath;
  }

  async getCities(query?: string): Promise<CityRecordDTO[]> {
    const records = await this.csvService.parseFile<Record<string, string>>(
      this.csvPath,
    );

    let filtered = records;
    if (query) {
      const search = query.trim().toLowerCase();
      filtered = records.filter((row) =>
        (row.city_ascii ?? '').toLowerCase().includes(search),
      );
    }

    // Sort alphabetically by city_ascii
    filtered.sort((a, b) =>
      (a.city_ascii ?? '').localeCompare(b.city_ascii ?? ''),
    );

    if (filtered.length === 0) {
      throw new NotFoundException('No cities found for the requested query');
    }

    return filtered.map((row) => ({
      real_name: row.city,
      ascii_name: row.city_ascii,
      country: row.country,
    }));
  }
}