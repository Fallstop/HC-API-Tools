import { formatISO, startOfDay, endOfDay } from 'date-fns';

export interface TimeTableDayHash {
    [details: string]: Object;
}

export interface BellTimeHash {
    [details: number]: Array<[string,]>;
}

export function convertDateToTimePeriodOfDay(inputTime: Date): [Date, Date] {
    return [startOfDay(inputTime), endOfDay(inputTime)];
}
export function convertDateTimeToISODate(input: Date): string {
    return formatISO(input, { representation: 'date' })
}

export function sameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}