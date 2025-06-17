import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NgModel } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { PokhService } from '../pokh/pokh-service/pokh.service';
@Component({
  selector: 'app-project-control',
  imports: [NzSelectModule, FormsModule],
  template: `
    <nz-select
      (ngModelChange)="onValueChange($event)"
      nzPlaceHolder="Chọn người phụ trách"
      style="width: 100%; height: 100%; font-size: 0.75rem;"
      [(ngModel)]="leaderId"
      nzAutoFocus
      nzAllowClear
      nzShowSearch
    >
      @for (item of leaders; track $index) {
      <nz-option
        nzCustomContent="true"
        [nzLabel]="item.FullName"
        [nzValue]="item.ID"
        nzAllowClear
        nzShowSearch
        nzCustomContent="true"
        >{{ item.FullName }}</nz-option
      >
      }
    </nz-select>
  `,
})
export class POKHControlerComponent implements OnInit {
  constructor(private PokhService: PokhService) {}
  ngOnInit(): void {
    console.log('leader', this.leaders);
  }
  @Input() leaderId: any;
  @Input() leaders: any[] = [];
  @Output() valueChange = new EventEmitter<any>();

  onValueChange(val: any) {
    console.log('val', val);
    this.valueChange.emit(val);
  }
}