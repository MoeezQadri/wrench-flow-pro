# Remove the Suspend button from Expired Trials

Expired trials already have no access, so suspending them does nothing useful.

## What changes

- In super admin, the **Expired Trials** list no longer shows a Suspend button — each shop just shows its name and how long ago its trial expired.
- The explanatory note under that list ("Suspending cancels a paid subscription at the end of its current billing period…") moves out of Expired Trials; it stays where it is relevant, on the paid/active list that still has a Suspend button.
- Suspend and Un-suspend stay exactly as they are for paid/active shops and for already-suspended shops.

## Technical notes

`src/components/superadmin/SubscriptionManagement.tsx`: drop the Suspend `Button` block and the trailing note paragraph inside the Expired Trials `CollapsibleCard` (lines ~236-259), leaving the name/status rows; add the same note under the active-subscriptions group that keeps its Suspend action. Leave `handleSuspend` in place — it is still used by the active group.
