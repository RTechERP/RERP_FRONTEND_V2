import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AngularGridInstance,
  Column,
  GridOption,
  AngularSlickgridModule,
  OnSelectedRowsChangedEventArgs
} from 'angular-slickgrid';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { KPIService } from '../kpi-service/kpi.service';

@Component({
  selector: 'app-kpi-rule-sumarize-team-choose-employee',
  templateUrl: './kpi-rule-sumarize-team-choose-employee.component.html',
  styleUrl: './kpi-rule-sumarize-team-choose-employee.component.css',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AngularSlickgridModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzModalModule,
  ],
})
export class KpiRuleSumarizeTeamChooseEmployeeComponent implements OnInit {
  @Input() lstEmp: any[] = []; // Input list of employees to choose from

  // Services
  private notification = inject(NzNotificationService);
  private modal = inject(NzModalService);
  private kpiService = inject(KPIService);
  public activeModal = inject(NgbActiveModal);

  // Grid
  angularGrid!: AngularGridInstance;
  employeeColumns: Column[] = [];
  employeeGridOptions!: GridOption;

  // Data
  allEmployees: any[] = [];
  filteredEmployees: any[] = [];
  selectedEmployees: any[] = [];
  searchKeyword: string = '';

  ngOnInit() {
    this.initGrid();
    this.loadData();
  }

  initGrid(): void {
    this.employeeColumns = [
      {
        id: 'Code',
        field: 'Code',
        name: 'Mã nhân viên',
        width: 120,
        sortable: true,
        filterable: true,
      },
      {
        id: 'FullName',
        field: 'FullName',
        name: 'Tên nhân viên',
        width: 300,
        sortable: true,
        filterable: true,
      }
    ];

    this.employeeGridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-employee-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container'
      },
      gridWidth: '100%',
      enableRowSelection: true,
      enableCheckboxSelector: true,
      checkboxSelector: {
        hideSelectAllCheckbox: false,
        width: 50
      },
      rowSelectionOptions: {
        selectActiveRow: false
      },
      multiSelect: true,
      enableCellNavigation: true,
      enableSorting: true,
      enableFiltering: false,
      enablePagination: false,
      forceFitColumns: true,
      rowHeight: 35,
      headerRowHeight: 40,
    };
  }

  loadData(): void {
    // Use input data if provided, otherwise fetch from API
    if (this.lstEmp && this.lstEmp.length > 0) {
      this.allEmployees = this.lstEmp.map((emp, index) => ({
        ...emp,
        id: emp.ID || index // Ensure each row has a unique id for SlickGrid
      }));
      this.filteredEmployees = [...this.allEmployees];

      // Select all rows by default (matching WinForms behavior)
      setTimeout(() => {
        if (this.angularGrid?.gridService) {
          const allRowIndexes = this.filteredEmployees.map((_, index) => index);
          this.angularGrid.gridService.setSelectedRows(allRowIndexes);
        }
      }, 100);
    }
  }

  onGridReady(event: any): void {
    this.angularGrid = event.detail || event;

    // Select all rows after grid is ready (matching WinForms grvData.SelectAll())
    setTimeout(() => {
      if (this.filteredEmployees.length > 0 && this.angularGrid?.gridService) {
        const allRowIndexes = this.filteredEmployees.map((_, index) => index);
        this.angularGrid.gridService.setSelectedRows(allRowIndexes);
      }
    }, 200);
  }

  onSelectedRowsChanged(event: any): void {
    const args = event.detail?.args || event.args || event;
    const selectedRowIndexes = args?.rows || [];
    this.selectedEmployees = selectedRowIndexes.map((rowIndex: number) => {
      return this.angularGrid?.dataView?.getItem(rowIndex);
    }).filter(Boolean);
  }

  onSearchKeywordChange(): void {
    if (!this.searchKeyword) {
      this.filteredEmployees = [...this.allEmployees];
    } else {
      const keyword = this.searchKeyword.toLowerCase();
      this.filteredEmployees = this.allEmployees.filter((emp: any) =>
        (emp.FullName?.toLowerCase().includes(keyword) || emp.Code?.toLowerCase().includes(keyword))
      );
    }
  }

  onSaveAndClose(): void {
    if (!this.selectedEmployees || this.selectedEmployees.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn ít nhất một nhân viên!');
      return;
    }

    // Return selected employees to the parent component
    const result = this.selectedEmployees.map((emp: any) => ({
      ID: emp.ID,
      Code: emp.Code || '',
      FullName: emp.FullName || '',
      EmployeeID: emp.ID || emp.EmployeeID || 0
    }));

    this.activeModal.close(result);
  }
}
