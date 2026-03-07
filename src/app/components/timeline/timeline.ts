import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarWeeks,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays
} from 'date-fns';
import { WORK_CENTERS, WORK_ORDERS } from '../../data/sample-data';
import { WorkOrderDocument } from '../../models/work-order.model';
import {
  CreateWorkOrderPayload,
  EditWorkOrderPayload,
  EditableWorkOrder,
  SelectedSlot,
  Timescale,
  WorkOrderPanel
} from '../work-order-panel/work-order-panel';

interface TimelineColumn {
  key: number;
  start: Date;
  end: Date;
  label: string;
}

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule, WorkOrderPanel],
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss'
})
export class Timeline implements AfterViewInit {

  @ViewChild('timelineViewport') viewportRef!: ElementRef<HTMLDivElement>;

  workCenters = WORK_CENTERS;
  workOrders: WorkOrderDocument[] = [...WORK_ORDERS];

  readonly timescales: Timescale[] = ['Day', 'Week', 'Month'];
  selectedTimescale: Timescale = 'Day';

  readonly dayViewCount   = 21;
  readonly weekViewCount  = 8;
  readonly monthViewCount = 6;

  selectedSlot: SelectedSlot | null = null;
  isPanelOpen           = false;
  panelMode: 'create' | 'edit' = 'create';
  panelOverlapError     = '';
  editingWorkOrder: EditableWorkOrder | null = null;
  openMenuForDocId: string | null = null;
  timescaleDropdownOpen = false;

  @HostListener('document:click')
  closeMenuOnOutsideClick(): void {
    this.openMenuForDocId = null;
    this.timescaleDropdownOpen = false;
  }

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.scrollToToday());
    });
  }

  get dayViewStart(): Date {
    return startOfDay(subDays(new Date(), Math.floor(this.dayViewCount / 2)));
  }

  get columns(): TimelineColumn[] {
    switch (this.selectedTimescale) {
      case 'Week':  return this.buildWeekColumns();
      case 'Month': return this.buildMonthColumns();
      default:      return this.buildDayColumns();
    }
  }

  get columnWidth(): number {
    switch (this.selectedTimescale) {
      case 'Week':  return 180;
      case 'Month': return 220;
      default:      return 120;
    }
  }

  get timelineCanvasWidth(): number {
    return this.columns.length * this.columnWidth;
  }

  get rangeStart(): Date { return this.columns[0].start; }
  get rangeEnd():   Date { return this.columns[this.columns.length - 1].end; }

  get currentLabel(): string {
    return `Current ${this.selectedTimescale.toLowerCase()}`;
  }

  getWorkOrdersForCenter(workCenterId: string): WorkOrderDocument[] {
    return this.workOrders.filter(order => {
      if (order.data.workCenterId !== workCenterId) return false;
      const barStart = parseISO(order.data.startDate);
      const barEnd   = parseISO(order.data.endDate);
      return barStart <= this.rangeEnd && barEnd >= this.rangeStart;
    });
  }

  getBarLeft(order: WorkOrderDocument): number {
    const start = parseISO(order.data.startDate);
    switch (this.selectedTimescale) {
      case 'Week':
        return differenceInCalendarWeeks(start, this.rangeStart, { weekStartsOn: 1 }) * this.columnWidth;
      case 'Month':
        return differenceInCalendarMonths(start, this.rangeStart) * this.columnWidth;
      default:
        return differenceInCalendarDays(start, this.rangeStart) * this.columnWidth;
    }
  }

  getBarWidth(order: WorkOrderDocument): number {
    const start = parseISO(order.data.startDate);
    const end   = parseISO(order.data.endDate);
    switch (this.selectedTimescale) {
      case 'Week':
        return (differenceInCalendarWeeks(end, start, { weekStartsOn: 1 }) + 1) * this.columnWidth;
      case 'Month':
        return (differenceInCalendarMonths(end, start) + 1) * this.columnWidth;
      default:
        return (differenceInCalendarDays(end, start) + 1) * this.columnWidth;
    }
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'open': 'Open', 'in-progress': 'In Progress',
      'complete': 'Complete', 'blocked': 'Blocked'
    };
    return map[status] ?? status;
  }

  isTodayColumn(column: TimelineColumn): boolean {
    return isWithinInterval(new Date(), { start: column.start, end: column.end });
  }

  get todayColumnIndex(): number {
    return this.columns.findIndex(col => this.isTodayColumn(col));
  }

  get todayOffset(): number | null {
    const idx = this.todayColumnIndex;
    if (idx === -1) return null;
    return idx * this.columnWidth + this.columnWidth / 2;
  }

  get showTodayIndicator(): boolean {
    return this.todayOffset !== null;
  }

  isMenuOpen(docId: string): boolean {
    return this.openMenuForDocId === docId;
  }

  toggleTimescaleDropdown(): void {
    this.timescaleDropdownOpen = !this.timescaleDropdownOpen;
  }

  selectTimescale(scale: Timescale): void {
    this.selectedTimescale = scale;
    this.timescaleDropdownOpen = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.scrollToToday());
    });
  }

  onTimelineRowClick(event: MouseEvent, workCenterId: string): void {
    if ((event.target as HTMLElement).closest('.work-order-bar')) return;

    const viewport   = this.viewportRef?.nativeElement;
    const scrollLeft = viewport?.scrollLeft ?? 0;
    const rowEl      = event.currentTarget as HTMLElement;
    const rect       = rowEl.getBoundingClientRect();
    const clickX = event.clientX - rect.left + scrollLeft;

    const columnIndex = Math.max(0, Math.min(
      Math.floor(clickX / this.columnWidth),
      this.columns.length - 1
    ));

    const selectedColumn = this.columns[columnIndex];
    const workCenter = this.workCenters.find(c => c.docId === workCenterId);
    if (!workCenter || !selectedColumn) return;

    this.selectedSlot = {
      workCenterId,
      workCenterName: workCenter.data.name,
      startDate:      format(selectedColumn.start, 'yyyy-MM-dd'),
      timescale:      this.selectedTimescale,
      columnLabel:    selectedColumn.label
    };

    this.editingWorkOrder  = null;
    this.panelMode         = 'create';
    this.panelOverlapError = '';
    this.isPanelOpen       = true;
  }

  toggleActionsMenu(event: MouseEvent, docId: string): void {
    event.stopPropagation();
    this.openMenuForDocId = this.openMenuForDocId === docId ? null : docId;
  }

  onEditWorkOrder(event: MouseEvent, order: WorkOrderDocument): void {
    event.stopPropagation();
    const workCenter = this.workCenters.find(c => c.docId === order.data.workCenterId);
    if (!workCenter) return;

    this.editingWorkOrder = {
      docId:          order.docId,
      name:           order.data.name,
      workCenterId:   order.data.workCenterId,
      workCenterName: workCenter.data.name,
      status:         order.data.status,
      startDate:      order.data.startDate,
      endDate:        order.data.endDate
    };

    this.selectedSlot      = null;
    this.panelMode         = 'edit';
    this.panelOverlapError = '';
    this.isPanelOpen       = true;
    this.openMenuForDocId  = null;
  }

  onDeleteWorkOrder(event: MouseEvent, docId: string): void {
    event.stopPropagation();
    this.workOrders = this.workOrders.filter(o => o.docId !== docId);
    this.openMenuForDocId = null;
  }

  closePanel(): void {
    this.isPanelOpen       = false;
    this.selectedSlot      = null;
    this.editingWorkOrder  = null;
    this.panelOverlapError = '';
  }

  handleCreateWorkOrder(payload: CreateWorkOrderPayload): void {
    if (this.hasOverlap(payload.workCenterId, payload.startDate, payload.endDate)) {
      this.panelOverlapError =
        'This work order overlaps with an existing order on the same work center. Please adjust the dates.';
      return;
    }
    this.workOrders = [...this.workOrders, {
      docId: this.generateId(), docType: 'workOrder',
      data: {
        name: payload.name, workCenterId: payload.workCenterId,
        status: payload.status, startDate: payload.startDate, endDate: payload.endDate
      }
    }];
    this.closePanel();
  }

  handleUpdateWorkOrder(payload: EditWorkOrderPayload): void {
    if (this.hasOverlap(payload.workCenterId, payload.startDate, payload.endDate, payload.docId)) {
      this.panelOverlapError =
        'This work order overlaps with an existing order on the same work center. Please adjust the dates.';
      return;
    }
    this.workOrders = this.workOrders.map(o =>
      o.docId === payload.docId
        ? { ...o, data: { ...o.data, name: payload.name, workCenterId: payload.workCenterId,
                          status: payload.status, startDate: payload.startDate, endDate: payload.endDate } }
        : o
    );
    this.closePanel();
  }

  private scrollToToday(): void {
    if (!this.viewportRef) return;
    const viewport = this.viewportRef.nativeElement;
    const idx = this.todayColumnIndex;
    if (idx === -1) return;

    const todayPx = idx * this.columnWidth + this.columnWidth / 2;
    const vpWidth = viewport.clientWidth || (window.innerWidth - 380);
    viewport.scrollLeft = Math.max(0, todayPx - vpWidth / 2);
  }

  private hasOverlap(wc: string, start: string, end: string, exclude?: string): boolean {
    const s = parseISO(start).getTime();
    const e = parseISO(end).getTime();
    return this.workOrders
      .filter(o => o.data.workCenterId === wc && o.docId !== exclude)
      .some(o =>
        s <= parseISO(o.data.endDate).getTime() &&
        e >= parseISO(o.data.startDate).getTime()
      );
  }

  private generateId(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? `wo-${crypto.randomUUID()}` : `wo-${Date.now()}`;
  }

  private buildDayColumns(): TimelineColumn[] {
    return Array.from({ length: this.dayViewCount }, (_, i) => {
      const date = addDays(this.dayViewStart, i);
      return {
        key:   date.getTime(),
        start: startOfDay(date),
        end:   endOfDay(date),
        label: format(date, 'MMM d')
      };
    });
  }

  private buildWeekColumns(): TimelineColumn[] {
    const first = addWeeks(
      startOfWeek(new Date(), { weekStartsOn: 1 }),
      -Math.floor(this.weekViewCount / 2)
    );
    return Array.from({ length: this.weekViewCount }, (_, i) => {
      const start = addWeeks(first, i);
      const end   = endOfWeek(start, { weekStartsOn: 1 });
      return { key: start.getTime(), start, end, label: `${format(start, 'MMM d')} - ${format(end, 'MMM d')}` };
    });
  }

  private buildMonthColumns(): TimelineColumn[] {
    const first = addMonths(
      startOfMonth(new Date()),
      -Math.floor(this.monthViewCount / 2)
    );
    return Array.from({ length: this.monthViewCount }, (_, i) => {
      const start = addMonths(first, i);
      const end   = endOfMonth(start);
      return { key: start.getTime(), start, end, label: format(start, 'MMM yyyy') };
    });
  }
}