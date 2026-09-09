# Fix duplicate attendance records

## What the data shows (checked, not assumed)

I looked at the live attendance table: 159 records, 146 unique technician + day combinations, so 13 extra rows.

The extras are exact copies — same technician, same day, same check-in time, same status — saved milliseconds apart:

```text
8a16dea5...  24 Aug  13:13:25.490  and  13:13:25.602   (112 ms apart)
c2ba131b...  24 Aug  13:13:50.546  and  13:13:50.642   ( 96 ms apart)
0eb32733...  24 Aug  13:14:34.018 / .074 / .107        (three copies, 90 ms total)
915fc767...   9 Sep  11:28:01.107  and  11:28:01.219   (112 ms apart)
```

Two others were saved further apart (17 seconds and 4 minutes) — those look like someone entering the same day again.

There is nothing in the database creating copies: the only trigger on attendance just stamps the shop ID. And there is only one place in the app that saves attendance. So each copy comes from the save being triggered more than once, and nothing currently stops it:

- the Check In button stays clickable while saving, so a fast double or triple click sends the entry two or three times
- the window only closes after the save finishes, leaving time for extra clicks
- the database has no rule preventing a second entry for the same technician and day

## What I'll change

1. **Block repeat submits.** The Check In / Add Leave buttons become disabled and show "Saving..." the moment they're pressed, and the save function ignores a second call while one is still in flight. Same for check-out.
2. **Enforce one entry per technician per day in the database**, so a duplicate can never be stored even from a second browser tab or a stale page.
3. **Friendly message** when someone tries to add a day that already exists: "This technician already has an entry for this date" instead of a raw error.
4. **Clean up the 13 existing extras**, keeping the most complete row for each technician/day (the one with check-out time and notes filled in).
5. **Re-check the table afterwards** to confirm unique count equals total count.

## Testing

- Rapid-fire the Check In button and confirm only one record appears.
- Add the same technician/day twice and confirm the clear message appears, no second row.
- Confirm check-out, approve/reject, and leave entries still work, and attendance summary and the attendance report totals match the cleaned data.

## Technical notes

- Delete extras with `run_sql`, ranking rows per (organization_id, mechanic_id, date, record_type) preferring non-null check_out, then notes, then earliest created_at.
- Migration adds `CREATE UNIQUE INDEX attendance_unique_day ON public.attendance (organization_id, mechanic_id, date, record_type)`; run after cleanup.
- `useAttendance.addAttendance`: add an in-flight key set (`mechanic_id|date|record_type`) guard, map Postgres error `23505` to the friendly message, and keep the existing optimistic rollback.
- `CheckInForm`, `LeaveForm`, `CheckOutForm`: disable submit via `form.formState.isSubmitting` / local `saving` state.
