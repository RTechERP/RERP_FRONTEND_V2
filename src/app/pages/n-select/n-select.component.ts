import { Component, EventEmitter, Input, Output } from '@angular/core';
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
        nzAllowClear
        nzShowSearch
      >
        {{ getDisplayValue(item, displayField) }}
      </nz-option>
      }
    </nz-select>
  `
})
export class NSelectComponent {
  @Input() value: any;
  @Input() dataSource: any[] = [];
  @Input() placeholder: string = 'Vui lòng chọn';
  
  // Các trường tùy chỉnh để hiển thị và lấy giá trị
  @Input() labelField: string = 'Code';
  @Input() valueField: string = 'ID';
  @Input() displayField: string = 'Code';
  
  @Output() valueChange = new EventEmitter<any>();

  onValueChange(val: any) {
    this.valueChange.emit(val);
  }

  // Phương thức để lấy giá trị hiển thị từ item dựa trên trường được chỉ định
  // Sửa method getDisplayValue để trả về đúng kiểu dữ liệu cho valueField
  getDisplayValue(item: any, fieldName: string): any {
    if (!item) return '';
    
    // Hỗ trợ truy cập các trường lồng nhau (ví dụ: 'supplier.name')
    if (fieldName.includes('.')) {
      const parts = fieldName.split('.');
      let value = item;
      for (const part of parts) {
        if (value && value[part] !== undefined) {
          value = value[part];
        } else {
          return '';
        }
      }
      return value;
    }
    
    return item[fieldName] !== undefined ? item[fieldName] : '';
  }
  
  // Thêm method riêng để lấy giá trị cho nzValue (giữ nguyên kiểu dữ liệu)
  getValue(item: any, fieldName: string): any {
    if (!item) return null;
    
    if (fieldName.includes('.')) {
      const parts = fieldName.split('.');
      let value = item;
      for (const part of parts) {
        if (value && value[part] !== undefined) {
          value = value[part];
        } else {
          return null;
        }
      }
      return value;
    }
    
    return item[fieldName] !== undefined ? item[fieldName] : null;
  }
}

