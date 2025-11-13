import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
@Component({
  selector: 'app-select-control',
  standalone: true,
  imports: [CommonModule, FormsModule, NzSelectModule],
  template: `
    <nz-select
      [(ngModel)]="selectedValue"
      (ngModelChange)="onValueChange($event)"
      [style.width.%]="100"
      nzShowSearch
      nzAllowClear
       nzDropdownClassName="custom-tabulator-dropdown"
      [nzPlaceHolder]="placeholder"
    >
      <nz-option
        *ngFor="let item of data"
        [nzLabel]="item[labelField]"
        [nzValue]="item[valueField]"
      ></nz-option>
    </nz-select>
  `,
})
export class SelectControlComponent implements OnInit{
  @Input() id: any;
  @Input() data: any[] = [];
  @Output() valueChange = new EventEmitter<any>();

  // --- Các Input CẤU HÌNH mới ---
  @Input() valueField: string = 'value'; // Tên thuộc tính làm giá trị (value)
  @Input() labelField: string = 'label'; // Tên thuộc tính làm nhãn (label)
  @Input() placeholder: string = 'Vui lòng chọn...'; // Placeholder cho dropdown

  selectedValue: any;

  ngOnInit() {
    this.selectedValue = this.id;
  }

  onValueChange(value: any) {
    this.valueChange.emit(value);
  }
}