export interface PublicHoliday {
  readonly date: string;
  readonly name: string;
}

export interface PublicHolidayClient {
  holidaysIn(year: number, countryCode: string): Promise<PublicHoliday[]>;
}
