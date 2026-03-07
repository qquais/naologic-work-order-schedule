import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Injectable,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { addDays, format } from 'date-fns';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  NgbDateParserFormatter,
  NgbDatepickerModule,
  NgbDateStruct,
  NgbInputDatepicker,
} from '@ng-bootstrap/ng-bootstrap';

@Injectable()
export class MmDdYyyyDateFormatter extends NgbDateParserFormatter {
  parse(value: string): NgbDateStruct | null {
    if (!value) return null;
    const parts = value.trim().split('/');
    if (parts.length !== 3) return null;
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (isNaN(month) || isNaN(day) || isNaN(year)) return null;
    return { year, month, day };
  }
  format(date: NgbDateStruct | null): string {
    if (!date) return '';
    const mm = String(date.month).padStart(2, '0');
    const dd = String(date.day).padStart(2, '0');
    return `${mm}/${dd}/${date.year}`;
  }
}

export type WorkOrderStatus = 'open' | 'in-progress' | 'complete' | 'blocked';
export type Timescale = 'Hour' | 'Day' | 'Week' | 'Month';

export interface SelectedSlot {
  workCenterId: string;
  workCenterName: string;
  startDate: string;
  timescale: Timescale;
  columnLabel: string;
}

export interface CreateWorkOrderPayload {
  name: string;
  workCenterId: string;
  status: WorkOrderStatus;
  startDate: string;
  endDate: string;
}

export interface EditWorkOrderPayload extends CreateWorkOrderPayload {
  docId: string;
}

export interface EditableWorkOrder {
  docId: string;
  name: string;
  workCenterId: string;
  workCenterName: string;
  status: WorkOrderStatus;
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-work-order-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, NgbDatepickerModule],
  templateUrl: './work-order-panel.html',
  styleUrl: './work-order-panel.scss',
  providers: [{ provide: NgbDateParserFormatter, useClass: MmDdYyyyDateFormatter }],
})
export class WorkOrderPanel implements OnChanges {
  @ViewChild('dpEnd')   private dpEnd!: NgbInputDatepicker;
  @ViewChild('dpStart') private dpStart!: NgbInputDatepicker;

  @HostListener('document:click')
  onDocumentClick(): void {
    this.dpEnd?.close();
    this.dpStart?.close();
  }

  @Input() isOpen = false;
  @Input() selectedSlot: SelectedSlot | null = null;
  @Input() overlapError = '';
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() editingWorkOrder: EditableWorkOrder | null = null;

  @Output() closePanel = new EventEmitter<void>();
  @Output() saveWorkOrder = new EventEmitter<CreateWorkOrderPayload>();
  @Output() updateWorkOrder = new EventEmitter<EditWorkOrderPayload>();

  readonly statusOptions = [
    { label: 'Open',        value: 'open'        as WorkOrderStatus },
    { label: 'In Progress', value: 'in-progress'  as WorkOrderStatus },
    { label: 'Complete',    value: 'complete'     as WorkOrderStatus },
    { label: 'Blocked',     value: 'blocked'      as WorkOrderStatus },
  ];

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group(
      {
        name:      ['',   [Validators.required, Validators.maxLength(100)]],
        status:    ['open' as WorkOrderStatus, Validators.required],
        startDate: [null as NgbDateStruct | null, Validators.required],
        endDate:   [null as NgbDateStruct | null, Validators.required],
      },
      { validators: [this.dateOrderValidator.bind(this)] },
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.isOpen) return;

    if (this.mode === 'edit' && this.editingWorkOrder) {
      this.resetFormForEdit();
      return;
    }

    if ((changes['selectedSlot'] || changes['isOpen']) && this.selectedSlot) {
      this.resetFormForSelectedSlot();
    }
  }

  get nameControl()      { return this.form.get('name')!; }
  get startDateControl() { return this.form.get('startDate')!; }
  get endDateControl()   { return this.form.get('endDate')!; }
  get statusControl()    { return this.form.get('status')!; }

  get dateOrderInvalid(): boolean {
    return !!this.form.errors?.['dateOrder'] && this.form.touched;
  }

  get panelTitle(): string { return 'Work Order Details'; }

  get panelDescription(): string {
    return 'Specify the dates, name and status for this order';
  }

  get primaryButtonLabel(): string {
    return this.mode === 'edit' ? 'Save' : 'Create';
  }

  onCancel(): void { this.closePanel.emit(); }

  onSave(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const startDateStruct = this.startDateControl.value as NgbDateStruct | null;
    const endDateStruct   = this.endDateControl.value   as NgbDateStruct | null;
    const name   = (this.nameControl.value as string | null)?.trim();
    const status = this.statusControl.value as WorkOrderStatus | null;

    if (!startDateStruct || !endDateStruct || !name || !status) return;

    if (this.mode === 'edit' && this.editingWorkOrder) {
      this.updateWorkOrder.emit({
        docId:        this.editingWorkOrder.docId,
        name,
        workCenterId: this.editingWorkOrder.workCenterId,
        status,
        startDate:    this.toIsoDate(startDateStruct),
        endDate:      this.toIsoDate(endDateStruct),
      });
      return;
    }

    if (!this.selectedSlot) return;

    this.saveWorkOrder.emit({
      name,
      workCenterId: this.selectedSlot.workCenterId,
      status,
      startDate:    this.toIsoDate(startDateStruct),
      endDate:      this.toIsoDate(endDateStruct),
    });
  }

  private resetFormForSelectedSlot(): void {
    if (!this.selectedSlot) return;

    const startDate = new Date(this.selectedSlot.startDate);
    const endDate   = addDays(startDate, 7);

    this.form.reset({
      name:      '',
      status:    'open',
      startDate: this.toDateStruct(startDate),
      endDate:   this.toDateStruct(endDate),
    });

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private resetFormForEdit(): void {
    if (!this.editingWorkOrder) return;

    this.form.reset({
      name:      this.editingWorkOrder.name,
      status:    this.editingWorkOrder.status,
      startDate: this.toDateStruct(new Date(this.editingWorkOrder.startDate)),
      endDate:   this.toDateStruct(new Date(this.editingWorkOrder.endDate)),
    });

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private toDateStruct(date: Date): NgbDateStruct {
    return {
      year:  date.getFullYear(),
      month: date.getMonth() + 1,
      day:   date.getDate(),
    };
  }

  private toIsoDate(dateStruct: NgbDateStruct): string {
    const date = new Date(dateStruct.year, dateStruct.month - 1, dateStruct.day);
    return format(date, 'yyyy-MM-dd');
  }

  private dateOrderValidator(control: AbstractControl): ValidationErrors | null {
    const start = control.get('startDate')?.value as NgbDateStruct | null;
    const end   = control.get('endDate')?.value   as NgbDateStruct | null;

    if (!start || !end) return null;

    const startMs = new Date(start.year, start.month - 1, start.day).getTime();
    const endMs   = new Date(end.year,   end.month   - 1, end.day).getTime();

    return endMs >= startMs ? null : { dateOrder: true };
  }
}