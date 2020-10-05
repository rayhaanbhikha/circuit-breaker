import { differenceInMilliseconds } from "date-fns";

export class Time {
  static getCurrentTime() {
    return Date.now();
  }

  static differenceInMilliseconds(date1: number | Date, date2: number | Date) {
    return differenceInMilliseconds(date1, date2);
  }
}
