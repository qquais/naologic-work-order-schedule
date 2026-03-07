import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Timeline } from './timeline';
import { WORK_ORDERS } from '../../data/sample-data';

const LS_KEY = 'naologic_work_orders';

describe('Timeline', () => {
  let component: Timeline;
  let fixture: ComponentFixture<Timeline>;

  beforeEach(async () => {
    localStorage.removeItem(LS_KEY);

    await TestBed.configureTestingModule({
      imports: [Timeline],
    }).compileComponents();

    fixture = TestBed.createComponent(Timeline);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => localStorage.removeItem(LS_KEY));

  // ── Component bootstrap ─────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the Work Orders heading', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1?.textContent?.trim()).toBe('Work Orders');
  });

  it('should render all 5 work centers', () => {
    const rows = fixture.nativeElement.querySelectorAll('.work-center-row');
    expect(rows.length).toBe(5);
  });

  // ── Timescale ───────────────────────────────────────────────────────────

  it('should default to Day timescale', () => {
    expect(component.selectedTimescale).toBe('Day');
  });

  it('should show Day / Week / Month options only (no Hour)', () => {
    expect(component.timescales).toEqual(['Day', 'Week', 'Month']);
    expect(component.timescales).not.toContain('Hour');
  });

  it('should switch timescale to Week', () => {
    component.selectTimescale('Week');
    expect(component.selectedTimescale).toBe('Week');
  });

  it('should switch timescale to Month', () => {
    component.selectTimescale('Month');
    expect(component.selectedTimescale).toBe('Month');
  });

  it('should produce 21 columns in Day view', () => {
    component.selectedTimescale = 'Day';
    expect(component.columns.length).toBe(21);
  });

  it('should produce 8 columns in Week view', () => {
    component.selectedTimescale = 'Week';
    expect(component.columns.length).toBe(8);
  });

  it('should produce 6 columns in Month view', () => {
    component.selectedTimescale = 'Month';
    expect(component.columns.length).toBe(6);
  });

  it('should use 120px column width for Day', () => {
    component.selectedTimescale = 'Day';
    expect(component.columnWidth).toBe(120);
  });

  it('should use 180px column width for Week', () => {
    component.selectedTimescale = 'Week';
    expect(component.columnWidth).toBe(180);
  });

  it('should use 220px column width for Month', () => {
    component.selectedTimescale = 'Month';
    expect(component.columnWidth).toBe(220);
  });

  // ── Today indicator ─────────────────────────────────────────────────────

  it('should find today within the Day columns', () => {
    component.selectedTimescale = 'Day';
    expect(component.todayColumnIndex).toBeGreaterThan(-1);
  });

  it('should show the today indicator in Day view', () => {
    component.selectedTimescale = 'Day';
    expect(component.showTodayIndicator).toBe(true);
  });

  // ── Panel open / close ──────────────────────────────────────────────────

  it('should start with panel closed', () => {
    expect(component.isPanelOpen).toBe(false);
  });

  it('closePanel() should reset all panel state', () => {
    component.isPanelOpen = true;
    component.panelOverlapError = 'some error';
    component.closePanel();
    expect(component.isPanelOpen).toBe(false);
    expect(component.selectedSlot).toBeNull();
    expect(component.editingWorkOrder).toBeNull();
    expect(component.panelOverlapError).toBe('');
  });

  // ── Keyboard navigation ─────────────────────────────────────────────────

  it('Escape should close the panel when open', () => {
    component.isPanelOpen = true;
    component.onEscapeKey();
    expect(component.isPanelOpen).toBe(false);
  });

  it('Escape should close the actions menu when open', () => {
    component.openMenuForDocId = 'wo-test';
    component.onEscapeKey();
    expect(component.openMenuForDocId).toBeNull();
  });

  it('Escape should close timescale dropdown', () => {
    component.timescaleDropdownOpen = true;
    component.onEscapeKey();
    expect(component.timescaleDropdownOpen).toBe(false);
  });

  // ── Work order CRUD ─────────────────────────────────────────────────────

  it('handleCreateWorkOrder() should add a work order', () => {
    const before = component.workOrders.length;
    component.selectedSlot = {
      workCenterId: 'wc-genesis', workCenterName: 'Genesis Hardware',
      startDate: '2026-03-20', timescale: 'Day', columnLabel: 'Mar 20'
    };
    component.isPanelOpen = true;

    component.handleCreateWorkOrder({
      name: 'Test Order', workCenterId: 'wc-genesis',
      status: 'open', startDate: '2026-03-20', endDate: '2026-03-25'
    });

    expect(component.workOrders.length).toBe(before + 1);
    expect(component.isPanelOpen).toBe(false);
  });

  it('handleCreateWorkOrder() should reject overlapping dates', () => {
    // Rodriques Electrics already has 2026-03-01 → 2026-03-14
    const before = component.workOrders.length;
    component.isPanelOpen = true;

    component.handleCreateWorkOrder({
      name: 'Overlap Order', workCenterId: 'wc-rodriques',
      status: 'open', startDate: '2026-03-05', endDate: '2026-03-10'
    });

    expect(component.workOrders.length).toBe(before);
    expect(component.panelOverlapError).toBeTruthy();
    expect(component.isPanelOpen).toBe(true);
  });

  it('handleUpdateWorkOrder() should update an existing work order', () => {
    const target = component.workOrders.find(o => o.docId === 'wo-rodriques')!;
    component.handleUpdateWorkOrder({
      docId: target.docId, name: 'Updated Name',
      workCenterId: target.data.workCenterId, status: 'complete',
      startDate: '2026-03-01', endDate: '2026-03-14'
    });
    const updated = component.workOrders.find(o => o.docId === 'wo-rodriques')!;
    expect(updated.data.name).toBe('Updated Name');
    expect(updated.data.status).toBe('complete');
  });

  it('onDeleteWorkOrder() should remove the work order', () => {
    const before = component.workOrders.length;
    const fakeEvent = new MouseEvent('click');
    component.onDeleteWorkOrder(fakeEvent, 'wo-rodriques');
    expect(component.workOrders.length).toBe(before - 1);
    expect(component.workOrders.find(o => o.docId === 'wo-rodriques')).toBeUndefined();
  });

  // ── Bar positioning ─────────────────────────────────────────────────────

  it('getBarLeft() should return 0 for an order starting on rangeStart in Day view', () => {
    component.selectedTimescale = 'Day';
    const order = {
      docId: 'test', docType: 'workOrder' as const,
      data: {
        name: 'Test', workCenterId: 'wc-genesis', status: 'open' as const,
        startDate: component.rangeStart.toISOString().slice(0, 10),
        endDate:   component.rangeStart.toISOString().slice(0, 10)
      }
    };
    expect(component.getBarLeft(order)).toBe(0);
  });

  it('getBarWidth() should be 1 column for a single-day order in Day view', () => {
    component.selectedTimescale = 'Day';
    const order = {
      docId: 'test', docType: 'workOrder' as const,
      data: {
        name: 'Test', workCenterId: 'wc-genesis', status: 'open' as const,
        startDate: '2026-03-07', endDate: '2026-03-07'
      }
    };
    expect(component.getBarWidth(order)).toBe(component.columnWidth);
  });

  // ── localStorage persistence ────────────────────────────────────────────

  it('should save to localStorage on create', () => {
    component.selectedSlot = {
      workCenterId: 'wc-spartan', workCenterName: 'Spartan Manufacturing',
      startDate: '2026-03-20', timescale: 'Day', columnLabel: 'Mar 20'
    };
    component.handleCreateWorkOrder({
      name: 'Persist Test', workCenterId: 'wc-spartan',
      status: 'open', startDate: '2026-03-20', endDate: '2026-03-25'
    });

    const raw = localStorage.getItem(LS_KEY);
    expect(raw).toBeTruthy();
    const saved = JSON.parse(raw!);
    expect(saved.some((o: any) => o.data.name === 'Persist Test')).toBe(true);
  });

  it('should save to localStorage on delete', () => {
    const fakeEvent = new MouseEvent('click');
    component.onDeleteWorkOrder(fakeEvent, 'wo-alpha');

    const raw = localStorage.getItem(LS_KEY);
    const saved = JSON.parse(raw!);
    expect(saved.some((o: any) => o.docId === 'wo-alpha')).toBe(false);
  });

  it('should load work orders from localStorage on init', async () => {
    const saved = [
      {
        docId: 'wo-from-storage', docType: 'workOrder',
        data: {
          name: 'From Storage', workCenterId: 'wc-genesis',
          status: 'open', startDate: '2026-03-10', endDate: '2026-03-12'
        }
      }
    ];
    localStorage.setItem(LS_KEY, JSON.stringify(saved));

    fixture = TestBed.createComponent(Timeline);
    component = fixture.componentInstance;
    await fixture.whenStable();

    expect(component.workOrders.length).toBe(1);
    expect(component.workOrders[0].data.name).toBe('From Storage');
  });

  it('should fall back to sample data when localStorage is empty', () => {
    expect(component.workOrders.length).toBe(WORK_ORDERS.length);
  });
});