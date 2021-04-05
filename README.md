# hcapitools
### [Blog](https://jmw.nz/projects/hc-tools)

Just an API for interacting with Huanui Collage Sites

API Root: https://hctools.jmw.nz/api/


Current methods:
 - `gettimetableday/<?date>` *Completed*
 - `getdailynotice/<?date>` *Completed, without caching*
 - `getbelltimes` *Completed, without caching*

Env Variables
- CREDENTIALS=Google Service Account credentials JSON
- HC_DAY_CALENDER=Google Calendar ID for the Timetable Day route