import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { FiveSRuleErrorComponent } from './FiveSRuleError/five-s-rule-error.component';
import { FiveSErrorComponent } from './FiveSError/five-s-error.component';
import { FiveSDepartmentComponent } from './FiveSDepartment/five-s-department.component';

@Component({
  standalone: true,
  selector: 'app-rating-error',
  imports: [
    CommonModule,
    NzTabsModule,
    FiveSRuleErrorComponent,
    FiveSErrorComponent,
    FiveSDepartmentComponent
  ],
  template: `
    <div class="rating-error-container p-3">
      <nz-tabset>
        <nz-tab nzTitle="Quy tắc lỗi 5S">
          <app-five-s-rule-error></app-five-s-rule-error>
        </nz-tab>
        <nz-tab nzTitle="Danh mục lỗi 5S">
          <app-five-s-error></app-five-s-error>
        </nz-tab>
        <nz-tab nzTitle="Phòng ban chấm điểm 5S">
          <app-five-s-department></app-five-s-department>
        </nz-tab>
      </nz-tabset>
    </div>
  `,
  styles: [`
    .rating-error-container {
      background: #fff;
      height: 100%;
    }
    :host ::ng-deep .ant-tabs-nav {
      margin-bottom: 0;
    }
  `]
})
export class RatingErrorComponent implements OnInit {
  constructor() { }
  ngOnInit(): void { }
}

