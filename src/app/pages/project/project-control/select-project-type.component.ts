import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NgModel } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../project-service/project.service';
import { NzFormatEmitEvent, NzTreeNodeOptions } from 'ng-zorro-antd/tree';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
@Component({
  selector: 'app-project-control',
  imports: [NzSelectModule, FormsModule, NzTreeSelectModule],
  template: `
    <nz-tree-select
      [(ngModel)]="id"
      [nzNodes]="data"
      nzPlaceHolder="Chọn kiểu dự án"
      nzShowSearch
      [nzDefaultExpandAll]="true"
      (ngModelChange)="onValueChange($event)"
      style="width: 100%; font-size: 0.75rem;"
    >
    </nz-tree-select>
  `,
  styles: [
    `
      #cdk-overlay-1 {
        width: 18% !important;
      }
    `,
  ],
})
export class SelectProjectTypeComponent implements OnInit {
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
