import { Component, ViewEncapsulation } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';

import { FormsModule } from '@angular/forms'; 

import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio'; 

import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';

import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';

import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';

import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';

import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { OnInit, AfterViewInit } from '@angular/core';

import { SelectEditorComponent } from '../select-edit/select-edit.component';

import {
  ApplicationRef,
  createComponent,
  Type
} from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';


@Component({
  selector: 'app-project',
  standalone: true,
  imports: [
    NzCardModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
  ],
  templateUrl: './project-test.component.html',
  styleUrl: './project-test.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class ProjectTestComponent implements OnInit, AfterViewInit {
  sizeSearch: string = '0';
  sizeTable: string = '0';
  table: any;
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  constructor(
    private injector: EnvironmentInjector, // thay vì Injector
    private appRef: ApplicationRef
  ) {}

  ngOnInit(): void {
    this.createLabelsFromData();
  }

  ngAfterViewInit(): void {
    this.drawTable();
  }

  dataTable = [
    { LoacationID: 'VT01', SerialNumber: 'Active', Quantity: 5 },
    { LoacationID: 'VT02', SerialNumber: 'Inactive', Quantity: 10 },
  ];

  labels: { [key: number]: string } = {};

  createLabelsFromData() {
    this.labels = {};

    this.dataTable.forEach((item) => {
      // Nếu chưa có key, thêm vào labels
      if (!this.labels[item.Quantity]) {
        this.labels[item.Quantity] = item.SerialNumber;
      }
    });
  }

  drawTable(): void {
    debugger;
    this.table = new Tabulator('#tb_employeeMain', {
      data: this.dataTable,
      layout: 'fitColumns',
      height: '50vh',
      columns: [
        { title: 'Vị trí', field: 'LoacationID' },
        { title: 'Serial Number', field: 'SerialNumber' },
        {
          title: 'Số lượng',
          field: 'Quantity',
          editor: this.createdControl(
            SelectEditorComponent,
            this.injector,
            this.appRef,
            this.dataTable
          ),
          cellEdited: (cell) => {
            const field = cell.getField();
            const newValue = cell.getValue();
            const rowData = cell.getRow().getData();
            console.log(`Field ${field} changed to`, newValue);
            console.log('Row data now:', rowData);
          },
          formatter: (cell) => {
            const val = cell.getValue();
            return (
              `<div class="d-flex justify-content-between align-items-center"><p class="w-100 m-0">${this.labels[val]}</p> <i class="fas fa-angle-down"></i> <div>` ||
              'Unknown'
            );
          },
        },
      ],
    });
  }
  resetSearch() {
    console.log(this.table.getData());
  }
  searchProject() {}

  createdControl(
    component: Type<any>,
    injector: EnvironmentInjector,
    appRef: ApplicationRef,
    data: any
  ) {
    return function (cell: any, onRendered: any, success: any, cancel: any) {
      const container = document.createElement('div');
      const componentRef = createComponent(component, {
        environmentInjector: injector,
      });

      // Các tham số truyền vào tùy theo custom select
      componentRef.instance.value = cell.getValue();
      componentRef.instance.value = data;

      // Các tham số trả ra tùy chỉnh
      componentRef.instance.valueChange.subscribe((val: any) => {
        success(val);
      });

      container.appendChild((componentRef.hostView as any).rootNodes[0]);
      appRef.attachView(componentRef.hostView);
      onRendered(() => {
        if (container.firstElementChild) {
          (container.firstElementChild as HTMLElement).focus();
        }
      });

      return container;
    };
  }
}
