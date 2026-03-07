# Work Order Schedule Timeline

An interactive Gantt-style timeline for managing work orders across manufacturing work centers. Built as part of the Naologic Frontend Technical Test.

---

## Quick Start

```bash
npm install
ng serve
```

Then open [http://localhost:4200](http://localhost:4200) in your browser.

> **Font:** The app uses Circular Std. Add this to your `index.html` `<head>`:
> ```html
> <link rel="stylesheet" href="https://naologic-com-assets.naologic.com/fonts/circular-std/circular-std.css">
> ```

---

## Features

### Core
- **Timeline grid** with Day / Week / Month zoom levels via a Timescale dropdown
- **Work order bars** positioned accurately by start/end date, each showing name, status badge, and a three-dot actions menu
- **Create panel** — click any empty row area to open a slide-in panel pre-filled with the clicked date
- **Edit panel** — click the three-dot menu → Edit to update an existing order
- **Delete** — click the three-dot menu → Delete to remove an order immediately
- **Overlap detection** — saving a create or edit that overlaps another order on the same work center shows an inline error and blocks the save
- **Today indicator** — vertical line + highlighted column marking the current day/week/month
- **"Click to add dates" hint** — shown on row hover so the interaction is discoverable
- **Responsive** — horizontal scroll on the timeline, left Work Center panel stays fixed

### Sample Data
- 5 work centers: Genesis Hardware, Rodriques Electrics, Konsulting Inc, McMarrow Distribution, Spartan Manufacturing
- 8 work orders covering all 4 statuses (Open, In Progress, Complete, Blocked)
- Multiple non-overlapping orders on the same work center (Konsulting Inc, Genesis Hardware, Spartan Manufacturing)
- Dates centered around today so content is visible on first load

---

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── timeline/
│   │   │   ├── timeline.ts          # Main timeline component + all date logic
│   │   │   ├── timeline.html        # Template with @for control flow
│   │   │   └── timeline.scss        # All timeline styles
│   │   └── work-order-panel/
│   │       ├── work-order-panel.ts  # Slide-in panel, Reactive Form, validation
│   │       ├── work-order-panel.html
│   │       └── work-order-panel.scss
│   ├── data/
│   │   └── sample-data.ts           # Hardcoded work centers + work orders
│   └── models/
│       └── work-order.model.ts      # TypeScript interfaces
```

---

## Libraries Used

| Library | Why |
|---|---|
| `@angular/forms` (Reactive Forms) | Type-safe form handling with built-in validators |
| `@ng-select/ng-select` | Spec requirement; polished dropdown with clear/search options |
| `@ng-bootstrap/ng-bootstrap` (ngb-datepicker) | Spec requirement; accessible inline date picker |
| `date-fns` | Lightweight, tree-shakeable date utilities for all column/bar calculations |

---

## Key Implementation Notes

### Date-to-pixel positioning

Bar positions are calculated from the visible range start:

```
barLeft  = differenceInCalendarDays(startDate, rangeStart) * columnWidth
barWidth = (differenceInCalendarDays(endDate, startDate) + 1) * columnWidth
```

The same formula scales up for Week and Month views using `differenceInCalendarWeeks` / `differenceInCalendarMonths`.

### endOfDay fix

The Day view columns use `endOfDay(date)` (not just `date`) as the column `end` value. This ensures `isWithinInterval(new Date(), { start, end })` returns `true` at any time of day, not only at exactly midnight.

### Overlap detection

On create/save, all existing orders for the same work center are checked:

```
newStart <= existingEnd && newEnd >= existingStart
```

The order being edited is excluded from the check by `docId` so users can re-save without a false positive.

### Single panel for create + edit

`WorkOrderPanel` takes a `mode: 'create' | 'edit'` input. In create mode the form is reset with the clicked slot's start date and start + 7 days as the default end. In edit mode it is pre-populated from the existing order. The primary button label changes between "Create" and "Save".

---

## Running Tests

```bash
ng test
```

A basic smoke test for the `Timeline` component is included in `timeline.spec.ts`.

---

## What I Would Add With More Time

- **localStorage persistence** — serialize `workOrders` on every mutation, rehydrate on init
- **Keyboard navigation** — `Escape` closes panel, `Tab` cycles form fields
- **"Today" button** — scrolls the timeline viewport to center on today's column
- **Tooltip on bar hover** — shows full date range and status
- **Infinite horizontal scroll** — dynamically prepend/append columns as the user scrolls to the edge
- **OnPush change detection** — profile first, then apply where it makes a measurable difference
- **Cypress E2E tests** — create, edit, delete, overlap error scenario

---

## Author

Built for the Naologic Frontend Technical Test.