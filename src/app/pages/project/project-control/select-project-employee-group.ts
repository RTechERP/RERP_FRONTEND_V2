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
      nzPlaceHolder="Chọn nhân viên"
      style="width: 100%; height: 100%; font-size: 0.75rem;"
      [(ngModel)]="id"
      nzAutoFocus
      nzAllowClear
      nzShowSearch
    >
      @for (parent of data; track $index) {
      <nz-option-group [nzLabel]="parent.label">
        @for (child of parent.options; track $index) {
        <nz-option
          nzCustomContent="true"
          [nzLabel]="child.item.FullName"
          [nzValue]="child.item.ID"
          >{{ child.item.Code + ' - ' + child.item.FullName }}</nz-option
        >
        }
      </nz-option-group>
      }
    </nz-select>
  `,
})
export class SelectProjectEmployeeGroupComponent implements OnInit {
  constructor(private projectService: ProjectService) {}
  ngOnInit(): void {}
  @Input() id: any;
  @Input() data: any[] = [];
  @Output() valueChange = new EventEmitter<any>();

  onValueChange(val: any) {
    console.log('val', val);
    this.valueChange.emit(val);
  }
}
