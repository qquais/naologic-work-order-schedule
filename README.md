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

### Bonus
- **localStorage persistence** — work orders are serialized on every mutation and rehydrated on init; falls back to sample data on first load
- **Smooth animations** — panel slides in from the right on open, work order bars lift on hover, dropdowns fade in on open
- **Keyboard navigation** — `Escape` closes the panel, actions menu, or timescale dropdown in priority order
- **32 automated tests** — covering timescale logic, CRUD operations, overlap detection, bar positioning, keyboard nav, and all localStorage scenarios

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
│   │   │   ├── timeline.ts          # Main timeline component + date logic + localStorage + keyboard nav
│   │   │   ├── timeline.html        # Template with @for control flow
│   │   │   ├── timeline.scss        # Grid, bars, hover lift animation, dropdown entrance
│   │   │   └── timeline.spec.ts     # 32 automated tests
│   │   └── work-order-panel/
│   │       ├── work-order-panel.ts  # Slide-in panel, Reactive Form, validation
│   │       ├── work-order-panel.html
│   │       └── work-order-panel.scss # Panel slide-in animation
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
| `@ng-bootstrap/ng-bootstrap` | Spec requirement; used for datepicker (see trade-off note below) |
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

### localStorage persistence

`workOrders` is saved to `localStorage` under the key `naologic_work_orders` after every create, update, and delete. On component init, the constructor attempts to load from storage first; if the key is missing or the data is corrupted it falls back to the sample data array. All storage calls are wrapped in try/catch to handle private browsing quota restrictions silently.

---

## Running Tests

```bash
ng test

# Single run (no watch)
ng test --watch=false
```

32 tests across the following scenarios:
- Component creation and initial render
- Timescale switching and column counts
- Today indicator detection
- Panel open/close state
- Escape key closing panel, menu, and dropdown
- Work order create, update, delete
- Overlap rejection
- Bar left position and width calculations
- localStorage save on create and delete
- localStorage load on init and fallback to sample data

---

## Known Trade-off

**Date inputs use native `<input type="date">`** instead of `ngb-datepicker` as specified. The inline `<ngb-datepicker>` component was implemented and the calendar grid rendered correctly, but the navigation header (month/year selects + arrows) remained invisible. This was caused by Angular's view encapsulation preventing `::ng-deep` from piercing `ngb-datepicker-navigation`'s own component host styles. Moving the styles to global `styles.scss` did not resolve it within this project's specific ng-bootstrap version. The native date input was used as a reliable fallback — the UX behaviour is functionally identical.

---

## What I Would Add With More Time

- **ngb-datepicker** — resolve the navigation encapsulation issue properly, likely by providing a custom `NgbDateAdapter` and targeting the host styles via a dedicated global override
- **"Today" button** — scrolls the timeline viewport to re-center on today's column
- **Tooltip on bar hover** — shows full date range and status in a floating overlay
- **Infinite horizontal scroll** — dynamically prepend/append columns as the user scrolls to the edge
- **OnPush change detection** — profile first, then apply where it makes a measurable difference
- **Cypress E2E tests** — create, edit, delete, overlap error scenario

---

## AI Usage

AI assistance (Claude) was used during this project for:
- Debugging the `ngb-datepicker` view encapsulation issue
- `date-fns` column calculation edge cases
- SCSS animation keyframes
- Generating test case scaffolding for edge cases (overlap, localStorage fallback, keyboard nav)

> Full prompts and decision log: [AI-PROMPTS.md](./AI-PROMPTS.md)

All component architecture, TypeScript interfaces, form structure, and final code decisions were made and reviewed manually.

---

## Author

Built for the Naologic Frontend Technical Test.