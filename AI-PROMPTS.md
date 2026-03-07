# AI Usage & Prompts

This file documents how AI assistance (Claude by Anthropic) was used during this project, as requested by the spec.

---

## 1. Removing the Hour Timescale

**Problem:** The initial scaffold included an `Hour` timescale that wasn't mentioned in the spec.

**Prompt used:**
> "I want to remove the Hour timescale because it is not mentioned in the specification file."

**Decision made:**
- Removed `'Hour'` from the `timescales` array in `timeline.ts`
- Removed `hourViewCount`, `buildHourColumns()`, and all `case 'Hour':` branches
- Removed unused `addHours` / `startOfHour` imports from `date-fns`
- Updated the `Timescale` type in `work-order-panel.ts` from `'Hour' | 'Day' | 'Week' | 'Month'` to `'Day' | 'Week' | 'Month'`

---

## 2. ngb-datepicker Integration (Attempted)

**Problem:** The spec requires `ngb-datepicker` for date inputs. The popup directive approach (`<input ngbDatepicker>`) appends the calendar to `<body>`, making it unreachable by component-scoped SCSS.

**Prompt used:**
> "The datepicker calendar renders but the navigation header (month/year selects + arrows) is invisible. ::ng-deep isn't working."

**What was tried:**
1. `<input ngbDatepicker>` popup directive — calendar appended to `<body>`, styles unreachable
2. Inline `<ngb-datepicker>` component with `::ng-deep` in component SCSS — grid rendered but navigation host styles not pierced
3. Moving all datepicker styles to global `styles.scss` — navigation still collapsed due to `ngb-datepicker-navigation` component host encapsulation

**Decision made:**
- Fell back to native `<input type="date">` which is fully functional and accessible
- Documented the trade-off in README.md
- `@ng-bootstrap/ng-bootstrap` is still installed and imported (used for `NgbDatepickerModule`)

---

## 3. localStorage Persistence

**Problem:** Work orders needed to survive page refresh.

**Prompt used:**
> "Implement localStorage persistence for work orders."

**Decision made:**
- Added `loadFromStorage()` called directly in the class field initializer so data is available before `ngOnInit`
- `saveToStorage()` called after every create, update, and delete mutation
- Storage key: `naologic_work_orders`
- Falls back to sample data if key is missing, empty, or JSON is corrupted
- All calls wrapped in `try/catch` to handle private browsing quota restrictions silently

---

## 4. Smooth Animations

**Problem:** Panel open and bar interactions needed to feel polished.

**Prompt used:**
> "Add smooth animations — panel slide-in and bar hover."

**Decision made:**
- Panel: `@keyframes panel-slide-in` — `translateX(100%) → translateX(0)` over 250ms with `cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- Backdrop: `@keyframes backdrop-in` — opacity fade over 200ms
- Bars: `transition: transform 0.15s ease` with `translateY(-2px)` + shadow lift on `:hover`
- Dropdowns (timescale + actions menu): `@keyframes dropdown-in` — fade + 4px slide in 120ms

---

## 5. Keyboard Navigation

**Problem:** The spec bonus asked for keyboard nav — specifically Escape to close panel.

**Prompt used:**
> "Add Escape key to close panel, actions menu, and timescale dropdown."

**Decision made:**
- Used Angular's `@HostListener('document:keydown.escape')` on the `Timeline` component
- Priority order: panel first → actions menu second → timescale dropdown third
- This keeps all keyboard logic in one place rather than spreading it across components

---

## 6. Automated Tests

**Problem:** 32 tests needed to cover all core logic, keyboard nav, and localStorage.

**Prompt used:**
> "Build automated tests covering timescale logic, CRUD, overlap detection, bar positioning, keyboard nav, and localStorage."

**Issues encountered and fixed:**
- Initial tests used Jasmine matchers (`toBeTrue()`, `toBeFalse()`) — project uses Vitest which requires `toBe(true)` / `toBe(false)`
- Create test used dates that overlapped with existing sample data (`wo-alpha`: Mar 10–17 on `wc-genesis`) — fixed by using Mar 20–25
- `app.spec.ts` had a stale Angular CLI boilerplate test checking for `'Hello, work-order-timeline'` in an h1 that doesn't exist — replaced with a minimal passing placeholder

**Decision made:**
- All 32 tests pass with `ng test --watch=false`
- Tests use `localStorage.removeItem(LS_KEY)` in `beforeEach` and `afterEach` to keep storage state isolated between test runs

---

## 7. Sample Data

**Problem:** Sample data needed to show all 4 statuses, multiple orders per work center, and be visible on first load without scrolling.

**Prompt used:**
> "Create sample data centered around today (Mar 7 2026) that is visible in the Day view window."

**Decision made:**
- 5 work centers with realistic names
- 8 work orders all within the Day view window (Feb 25 – Mar 17)
- Genesis Hardware, Konsulting Inc, and Spartan Manufacturing each have 2 non-overlapping orders to demonstrate the overlap detection feature
- All 4 statuses represented: `open`, `in-progress`, `complete`, `blocked`

---

## Summary

| Area | AI Used For | Final Decision |
|---|---|---|
| Hour timescale | Identifying all places to remove it | Fully removed |
| ngb-datepicker | Debugging encapsulation issue | Native input used as fallback |
| localStorage | Implementation approach | loadFromStorage() in field initializer |
| Animations | Keyframe values and timing | CSS-only, no JS animation libraries |
| Keyboard nav | HostListener approach | Single listener on Timeline component |
| Tests | Scaffolding + fixing Vitest compatibility | 32 passing tests |
| Sample data | Date ranges centered on today | All visible on Day view first load |