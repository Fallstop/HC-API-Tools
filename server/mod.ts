import { formatISO, startOfDay, endOfDay } from 'date-fns';

import openapi from '@wesleytodd/openapi';
require('dotenv').config();



export interface TimeTableDayHash {
    [details: string]: Object;
}

export interface BellTimeHash {
    [details: number]: Array<[string,]>;
}

export interface BellTimes {
    belltimes: BellTimeHash
}

export interface LunchTimeActivity {
    weekDay: number,
    weekRotation: number
}
export interface APIError {
    error: string
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

export const oapi = openapi({
    openapi: '3.0.0',
    info: {
        title: 'Express Application',
        description: 'Generated docs from an Express api',
        version: '1.0.0',
    },
});

export const ADMIN_TOKEN = process.env.ADMIN_TOKEN;