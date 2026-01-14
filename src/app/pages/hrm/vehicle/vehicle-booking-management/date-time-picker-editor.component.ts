import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { DateTime } from 'luxon';

@Component({
  selector: 'app-date-time-picker-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, NzDatePickerModule],
  template: `
    <nz-date-picker
      [(ngModel)]="dateValue"
      [nzShowTime]="{ nzFormat: 'HH:mm' }"
      [nzFormat]="'dd/MM/yyyy HH:mm'"
      nzSize="small"
      style="width: 100%"
      (ngModelChange)="onDateChange($event)"
      (nzOnOpenChange)="onOpenChange($event)"
    ></nz-date-picker>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class DateTimePickerEditorComponent implements OnInit {
  @Input() value: Date | string | null = null;
  @Output() valueChange = new EventEmitter<Date | null>();
  @Output() closeEditor = new EventEmitter<void>();

  dateValue: Date | null = null;

  ngOnInit() {
    if (this.value) {
      this.dateValue = this.value instanceof Date ? this.value : new Date(this.value);
    }
  }

  onDateChange(date: Date | null) {
    this.dateValue = date;
    if (date) {
      // Set giây về 0 trước khi emit
      const dateWithoutSeconds = new Date(date);
      dateWithoutSeconds.setSeconds(0, 0);
      this.valueChange.emit(dateWithoutSeconds);
    }
  }

  onOpenChange(open: boolean) {
    if (!open) {
      // Khi đóng picker, emit close event
      setTimeout(() => {
        this.closeEditor.emit();
      }, 100);
    }
  }
}

