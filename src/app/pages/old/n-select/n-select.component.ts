import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectorRef,
  AfterViewInit
} from '@angular/core';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-n-select',
  standalone: true,
  imports: [NzSelectModule, FormsModule, CommonModule],
  template: `
    <nz-select
      [(ngModel)]="value"
      (ngModelChange)="onValueChange($event)"
      (blur)="onBlur()"
      [nzAutoFocus]="true"
      nzShowSearch
      [nzPlaceHolder]="placeholder"
      style="width: 100%; height: 100%; font-size: 0.75rem;"
    >
      @for (item of dataSource; track $index) {
        <nz-option
          nzCustomContent="true"
          [nzLabel]="getDisplayValue(item, labelField)"
          [nzValue]="getValue(item, valueField)"
        >
          {{ getDisplayValue(item, displayField) }}
        </nz-option>
      }
    </nz-select>
  `
})
export class NSelectComponent implements AfterViewInit {
  @Input() value: any;
  @Input() dataSource: any[] = [];
  @Input() placeholder: string = 'Vui lòng chọn';

  @Input() labelField: string = 'Code';
  @Input() valueField: string = 'ID';
  @Input() displayField: string = 'Code';

  @Output() valueChange = new EventEmitter<any>();
  @Output() editorClosed = new EventEmitter<any>(); // Dùng để gửi lại khi blur mà không đổi

  private hasChanged = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }

  onValueChange(val: any) {
    this.hasChanged = true;
    this.valueChange.emit(val);
  }

  onBlur() {
    if (!this.hasChanged) {
      this.editorClosed.emit(this.value); // Gửi lại giá trị ban đầu nếu không đổi
    }
  }

  getDisplayValue(item: any, fieldName: string): any {
    if (!item) return '';
    if (fieldName.includes('.')) {
      const parts = fieldName.split('.');
      let value = item;
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) return '';
      }
      return value;
    }
    return item?.[fieldName] ?? '';
  }

  getValue(item: any, fieldName: string): any {
    if (!item) return null;
    if (fieldName.includes('.')) {
      const parts = fieldName.split('.');
      let value = item;
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) return null;
      }
      return value;
    }
    return item?.[fieldName] ?? null;
  }
}
