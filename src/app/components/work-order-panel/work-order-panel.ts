import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
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
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './work-order-panel.html',
  styleUrl: './work-order-panel.scss',
})
export class WorkOrderPanel implements OnChanges {

  @Input() isOpen = false;
  @Input() selectedSlot: SelectedSlot | null = null;
  @Input() overlapError = '';
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() editingWorkOrder: EditableWorkOrder | null = null;

  @Output() closePanel     = new EventEmitter<void>();
  @Output() saveWorkOrder  = new EventEmitter<CreateWorkOrderPayload>();
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
        startDate: ['', Validators.required],
        endDate:   ['', Validators.required],
      },
      { validators: [this.dateOrderValidator] },
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

    const name      = (this.nameControl.value as string).trim();
    const status    = this.statusControl.value as WorkOrderStatus;
    const startDate = this.startDateControl.value as string;
    const endDate   = this.endDateControl.value as string;

    if (!name || !status || !startDate || !endDate) return;

    if (this.mode === 'edit' && this.editingWorkOrder) {
      this.updateWorkOrder.emit({
        docId:        this.editingWorkOrder.docId,
        name,
        workCenterId: this.editingWorkOrder.workCenterId,
        status,
        startDate,
        endDate,
      });
      return;
    }

    if (!this.selectedSlot) return;

    this.saveWorkOrder.emit({
      name,
      workCenterId: this.selectedSlot.workCenterId,
      status,
      startDate,
      endDate,
    });
  }

  private resetFormForSelectedSlot(): void {
    if (!this.selectedSlot) return;

    const startDate = this.selectedSlot.startDate; // already yyyy-MM-dd
    const endDate   = format(addDays(new Date(startDate), 7), 'yyyy-MM-dd');

    this.form.reset({ name: '', status: 'open', startDate, endDate });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private resetFormForEdit(): void {
    if (!this.editingWorkOrder) return;

    this.form.reset({
      name:      this.editingWorkOrder.name,
      status:    this.editingWorkOrder.status,
      startDate: this.editingWorkOrder.startDate,
      endDate:   this.editingWorkOrder.endDate,
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private dateOrderValidator(control: AbstractControl): ValidationErrors | null {
    const start = control.get('startDate')?.value as string;
    const end   = control.get('endDate')?.value   as string;
    if (!start || !end) return null;
    return end >= start ? null : { dateOrder: true };
  }
}