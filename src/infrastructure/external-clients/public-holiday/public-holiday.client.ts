import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  PublicHoliday,
  PublicHolidayClient as IPublicHolidayClient,
} from '@application/common/external-clients/public-holiday/public-holiday.client.interface';

interface PublicHolidayResponse {
  date: string;
  localName: string;
  name: string;
}

// Reads only. Anything that changes state on the far side goes through the outbox instead,
// so a broker outage cannot roll back a caller who has already committed.
@Injectable()
export class PublicHolidayClient implements IPublicHolidayClient {
  constructor(private readonly http: HttpService) {}

  async holidaysIn(year: number, countryCode: string): Promise<PublicHoliday[]> {
    const response = await firstValueFrom(
      this.http.get<PublicHolidayResponse[]>(`/api/v3/PublicHolidays/${year}/${countryCode}`),
    );

    return response.data.map((holiday) => ({ date: holiday.date, name: holiday.localName || holiday.name }));
  }
}
