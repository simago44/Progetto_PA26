export const SECONDS = 1000;
export const MINUTES = 60 * SECONDS;
export const HOURS = 60 * MINUTES;

export function addInterval(date: Date, interval: number): Date {
  return new Date(date.getTime() + interval);
}

export function tomorrow(): Date {
  return addInterval(new Date(), 24 * HOURS);
}