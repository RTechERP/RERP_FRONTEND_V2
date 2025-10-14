import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NgModel } from '@angular/forms';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-SelectEditor',
  standalone: true,
  imports: [NzSelectModule, FormsModule],
  template: `
    <nz-select
      [(ngModel)]="value"
      (ngModelChange)="onValueChange($event)"
      [nzAutoFocus]="true"
      nzShowSearch
      style="width: 100%; height: 100%; font-size: 0.75rem;"
    >
    @for (item of dataSource; track $index) {
      <nz-option
        nzCustomContent="true"
        [nzLabel]="item.Code"
        [nzValue]="item.ID"
        nzAllowClear
        nzShowSearch
        nzCustomContent="true"
        >{{ item.Code}}</nz-option
      >
      }
    </nz-select>
  `
})
export class SelectEditorComponent {
  @Input() value: any;
  @Input() dataSource: any[] = [];
  @Output() valueChange = new EventEmitter<any>();

  onValueChange(val: any) {
    this.valueChange.emit(val);
  }
}

