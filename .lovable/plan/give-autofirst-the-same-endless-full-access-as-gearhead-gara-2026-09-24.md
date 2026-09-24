# Give AutoFirst the same endless full access as Gearhead Garage

## How Gearhead Garage gets it (checked)
- Gearhead Garage's database record still says "trial, expired". Its access comes from somewhere else.
- The owner email gearheadgarage.pk@gmail.com is written into the subscription check as a special account. When that check sees the email, it grants Enterprise access with no end date. The same applies to everyone in an organization whose owner or admin has that email.
- The Super Admin screen keeps its own copy of the same email list and shows those shops as "Internal".
- The one other special account is daniyal.reviewer@gmail.com (Test Garage plan).

## Change
- AutoFirst's owner is rajamurad@gmail.com. I'll add this email to both copies of the list:
  1. the subscription check, which gives AutoFirst's owner and all its staff full Enterprise access, and
  2. the Super Admin list, where AutoFirst will show as "Internal".
- I'll redeploy the subscription check.

## Side effects to know
- Being on the list also excludes an account from Google Analytics and Ads tracking, the same as Gearhead Garage. So AutoFirst's activity won't be tracked.
- Nothing changes in AutoFirst's database record or in Stripe.
- To remove the access later, take the email off both lists.

## Test
- Call the subscription check for AutoFirst's owner and confirm it returns Enterprise with no end date.
- Confirm AutoFirst shows as "Internal" in Super Admin.

## Technical details
- `supabase/functions/check-subscription/index.ts`: add the email to `OWNER_EMAILS`, then deploy.
- `src/utils/subscription-status.ts`: add the email to `INTERNAL_EMAILS`.
- Check whether the analytics exclusion has its own copy of the list, and add the email there if so. Also make the email comparisons case-insensitive.
