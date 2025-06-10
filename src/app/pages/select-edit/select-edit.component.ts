import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NgModel } from '@angular/forms';
import { FormsModule } from '@angular/forms';
@Component({ 
  selector: 'app-select-editor',
  imports:[NzSelectModule, FormsModule],
  template: `
    <nz-select
      (ngModelChange)="onValueChange($event)"
      nzPlaceHolder="Chọn trạng thái"
      style="width: 100%; height: 100%; font-size: 0.75rem;"
      [(ngModel)]="value"
      nzAutoFocus

    >
      <nz-option class="font-size: 0.75rem;" nzValue="5" nzLabel="Active"></nz-option>
      <nz-option nzValue="10" nzLabel="Inactive"></nz-option>
    </nz-select>
  `,
})
export class SelectEditorComponent implements OnInit {
  @Input() value: any;
  @Input() datataa: any[] = [];
  @Output() valueChange = new EventEmitter<any>();

  ngOnInit() {}

  onValueChange(val: any) {
    console.log('val', val)
    this.valueChange.emit(val);
  }
}
