export const seconds = 1000;
export const minutes = 60 * seconds;
export const hours = 60 * minutes;

export function addInterval(date: Date, interval: number): Date {
  return new Date(date.getTime() + interval);
}

export function tomorrow(): Date {
  return addInterval(new Date(), 24 * hours);
}