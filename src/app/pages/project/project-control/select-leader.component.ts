import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NgModel } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../project-service/project.service';
@Component({
  selector: 'app-project-control',
  imports: [NzSelectModule, FormsModule],
  template: `
    <nz-select
      (ngModelChange)="onValueChange($event)"
      nzPlaceHolder="Chọn leader"
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
        [nzValue]="item.EmployeeID"
        nzAllowClear
        nzShowSearch
        nzCustomContent="true"
        >{{ item.Code+" - "+item.FullName }}</nz-option
      >
      }
    </nz-select>
  `,
})
export class SelectLeaderComponent implements OnInit {
  constructor(private projectService: ProjectService) {}
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
