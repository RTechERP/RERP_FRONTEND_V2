import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, Optional, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AppUserService } from '../../../../services/app-user.service';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzCardModule } from 'ng-zorro-antd/card';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Formatters,
  GridOption
} from 'angular-slickgrid';
import { Menubar } from 'primeng/menubar';
import * as ExcelJS from 'exceljs';

import { KpiSyntheticYearsService } from './kpi-synthetic-years-service/kpi-synthetic-years.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-kpi-synthetic-years',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzIconModule,
    NzSelectModule,
    NzInputModule,
    NzInputNumberModule,
    NzSpinModule,
    NzCardModule,
    AngularSlickgridModule,
    Menubar
  ],
  templateUrl: './kpi-synthetic-years.component.html',
  styleUrl: './kpi-synthetic-years.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class KpiSyntheticYearsComponent implements OnInit {
  // Grid
  gridId: string = 'kpiSyntheticYearsGrid';
  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];

  // Menu
  menuBars: any[] = [];

  // Filters
  filters: any = {
    year: new Date().getFullYear(),
    departmentId: 0,
    employeeId: 0,
    keyword: ''
  };

  // Data
  departments: any[] = [];
  employees: any[] = [];
  isLoading: boolean = false;

  constructor(
    private kpiService: KpiSyntheticYearsService,
    private notification: NzNotificationService,
    private userService: AppUserService,
    private route: ActivatedRoute,
    @Optional() @Inject('tabData') private tabData: any
  ) {
    // Initial setup from params or tabData
    this.route.queryParams.subscribe(params => {
      this.filters.departmentId = Number(params['departmentId'] ?? this.tabData?.departmentId ?? this.userService.departmentID ?? 0);
    });

    // Initial setup from user service
    if (this.userService.employeeID) {
      this.filters.employeeId = this.userService.employeeID;
    }
  }

  ngOnInit(): void {
    this.initMenuBar();
    this.initGrid();
    this.loadDepartments();
    this.loadEmployees();
    this.search();
  }

  initMenuBar(): void {
    this.menuBars = [
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => {
          this.exportToExcel();
        }
      }
    ];
  }

  initGrid(): void {
    this.columnDefinitions = [
      // THÔNG TIN band
      {
        id: 'Stt', name: 'STT', field: 'Stt', sortable: true, width: 60, minWidth: 50,
        cssClass: 'text-center',
        headerCssClass: 'text-center',
        columnGroup: 'THÔNG TIN'
      },
      {
        id: 'FullName', name: 'Kỹ thuật', field: 'FullName', sortable: true, filterable: true, width: 200,
        columnGroup: 'THÔNG TIN'
      },
      {
        id: 'PositionName', name: 'Vị trí', field: 'PositionName', sortable: true, filterable: true, width: 120,
        columnGroup: 'THÔNG TIN'
      },
      {
        id: 'ProjectTypeName', name: 'Team', field: 'ProjectTypeName', sortable: true, filterable: true, width: 100,
        columnGroup: 'THÔNG TIN'
      },
      // QUÝ 1 band
      {
        id: 'TotalPercentQ1', name: '% Đánh giá', field: 'TotalPercentQ1', sortable: true, width: 100,
        cssClass: 'text-center',
        headerCssClass: 'text-center',
        columnGroup: 'QUÝ 1'
      },
      {
        id: 'TotalPercentTextQ1', name: 'Thang điểm', field: 'TotalPercentTextQ1', sortable: true, width: 100,
        cssClass: 'text-center',
        headerCssClass: 'text-center',
        columnGroup: 'QUÝ 1'
      },
      {
        id: 'IsApproveQ1', name: 'Duyệt', field: 'IsApproveQ1', sortable: true, width: 70,
        cssClass: 'text-center',
        headerCssClass: 'text-center',
        formatter: Formatters.checkmarkMaterial,
        columnGroup: 'QUÝ 1'
      },
      // QUÝ 2 band
      {
        id: 'TotalPercentQ2', name: '% Đánh giá', field: 'TotalPercentQ2', sortable: true, width: 100,
        cssClass: 'text-center',
        headerCssClass: 'text-center',
        columnGroup: 'QUÝ 2'
      },
      {
        id: 'TotalPercentTextQ2', name: 'Thang điểm', field: 'TotalPercentTextQ2', sortable: true, width: 100,
        cssClass: 'text-center',
        headerCssClass: 'text-center',
        columnGroup: 'QUÝ 2'
      },
      {
        id: 'IsApproveQ2', name: 'Duyệt', field: 'IsApproveQ2', sortable: true, width: 70,
        cssClass: 'text-center',
        headerCssClass: 'text-center',
        formatter: Formatters.checkmarkMaterial,
        columnGroup: 'QUÝ 2'
      },
      // QUÝ 3 band
      {
        id: 'TotalPercentQ3', name: '% Đánh giá', field: 'TotalPercentQ3', sortable: true, width: 100,
        cssClass: 'text-center',
        headerCssClass: 'text-center',
        columnGroup: 'QUÝ 3'
      },
      {
        id: 'TotalPercentTextQ3', name: 'Thang điểm', field: 'TotalPercentTextQ3', sortable: true, width: 100,
        cssClass: 'text-center',
        headerCssClass: 'text-center',
        columnGroup: 'QUÝ 3'
      },
      {
        id: 'IsApproveQ3', name: 'Duyệt', field: 'IsApproveQ3', sortable: true, width: 70,
        cssClass: 'text-center',
        headerCssClass: 'text-center',
        formatter: Formatters.checkmarkMaterial,
        columnGroup: 'QUÝ 3'
      },
      // QUÝ 4 band
      {
        id: 'TotalPercentQ4', name: '% Đánh giá', field: 'TotalPercentQ4', sortable: true, width: 100,
        cssClass: 'text-center',
        headerCssClass: 'text-center',
        columnGroup: 'QUÝ 4'
      },
      {
        id: 'TotalPercentTextQ4', name: 'Thang điểm', field: 'TotalPercentTextQ4', sortable: true, width: 100,
        cssClass: 'text-center',
        headerCssClass: 'text-center',
        columnGroup: 'QUÝ 4'
      },
      {
        id: 'IsApproveQ4', name: 'Duyệt', field: 'IsApproveQ4', sortable: true, width: 70,
        cssClass: 'text-center',
        headerCssClass: 'text-center',
        formatter: Formatters.checkmarkMaterial,
        columnGroup: 'QUÝ 4'
      },
      // CẢ NĂM band
      {
        id: 'PointPercentYear', name: '% Đánh giá', field: 'PointPercentYear', sortable: true, width: 100,
        cssClass: 'text-center',
        headerCssClass: 'text-center',
        columnGroup: 'CẢ NĂM'
      },
      {
        id: 'ScoreScaleYear', name: 'Thang điểm', field: 'ScoreScaleYear', sortable: true, width: 100,
        cssClass: 'text-center',
        headerCssClass: 'text-center',
        columnGroup: 'CẢ NĂM'
      },
      {
        id: 'IsApproveYear', name: 'Duyệt', field: 'IsApproveYear', sortable: true, width: 70,
        cssClass: 'text-center',
        headerCssClass: 'text-center',
        formatter: Formatters.checkmarkMaterial,
        columnGroup: 'CẢ NĂM'
      }
    ];

    this.gridOptions = {
      autoResize: {
        container: '.grid-container',
        calculateAvailableSizeBy: 'container'
      },
      enableAutoResize: true,
      gridWidth: '100%',
      enableSorting: true,
      enableFiltering: true,
      enableColumnReorder: true,
      enableCellNavigation: true,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: true
      },
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 35,
      frozenColumn: 3,
      rowHeight: 35,
      headerRowHeight: 40,
      enableGrouping: true,
      draggableGrouping: {
        dropPlaceHolderText: 'Kéo cột vào đây để nhóm',
        deleteIconCssClass: 'fa fa-times'
      }
    };
  }

  angularGridReady(angularGrid: AngularGridInstance): void {
    this.angularGrid = angularGrid;
  }

  loadDepartments(): void {
    this.kpiService.getDepartment().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.departments = response.data;
        }
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải phòng ban');
      }
    });
  }

  loadEmployees(): void {
    this.kpiService.getEmployee().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.employees = response.data;
        }
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải nhân viên');
      }
    });
  }

  search(): void {
    this.isLoading = true;
    this.kpiService.loadData(
      this.filters.year,
      this.filters.departmentId || 0,
      this.filters.employeeId || 0,
      this.filters.keyword || ''
    ).subscribe({
      next: (response: any) => {
        if (response.status === 1 && response.data) {
          this.dataset = response.data.map((item: any, index: number) => ({
            ...item,
            id: item.ID || index,
            Stt: index + 1
          }));
        } else {
          this.dataset = [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu');
        this.isLoading = false;
      }
    });
  }

  exportToExcel(): void {
    if (!this.dataset || this.dataset.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('TongHopKPINam');

    // Title
    worksheet.mergeCells('A1:S1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `TỔNG HỢP KPI THEO NĂM ${this.filters.year}`;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };

    // Headers - Row 2 (Band headers)
    const bandHeaders = ['THÔNG TIN', '', '', '', 'QUÝ 1', '', '', 'QUÝ 2', '', '', 'QUÝ 3', '', '', 'QUÝ 4', '', '', 'CẢ NĂM', '', ''];
    worksheet.addRow(bandHeaders);

    // Headers - Row 3 (Column headers)
    const columnHeaders = ['STT', 'Kỹ thuật', 'Vị trí', 'Team',
      '% Đánh giá', 'Thang điểm', 'Duyệt',
      '% Đánh giá', 'Thang điểm', 'Duyệt',
      '% Đánh giá', 'Thang điểm', 'Duyệt',
      '% Đánh giá', 'Thang điểm', 'Duyệt',
      '% Đánh giá', 'Thang điểm', 'Duyệt'];
    worksheet.addRow(columnHeaders);

    // Merge band header cells
    worksheet.mergeCells('A2:D2'); // THÔNG TIN
    worksheet.mergeCells('E2:G2'); // QUÝ 1
    worksheet.mergeCells('H2:J2'); // QUÝ 2
    worksheet.mergeCells('K2:M2'); // QUÝ 3
    worksheet.mergeCells('N2:P2'); // QUÝ 4
    worksheet.mergeCells('Q2:S2'); // CẢ NĂM

    // Style band headers
    const bandRow = worksheet.getRow(2);
    bandRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Style column headers
    const headerRow = worksheet.getRow(3);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Data rows
    this.dataset.forEach((item, index) => {
      const row = worksheet.addRow([
        index + 1,
        item.FullName || '',
        item.PositionName || '',
        item.ProjectTypeName || '',
        item.TotalPercentQ1 || '',
        item.TotalPercentTextQ1 || '',
        item.IsApproveQ1 ? 'Có' : 'Không',
        item.TotalPercentQ2 || '',
        item.TotalPercentTextQ2 || '',
        item.IsApproveQ2 ? 'Có' : 'Không',
        item.TotalPercentQ3 || '',
        item.TotalPercentTextQ3 || '',
        item.IsApproveQ3 ? 'Có' : 'Không',
        item.TotalPercentQ4 || '',
        item.TotalPercentTextQ4 || '',
        item.IsApproveQ4 ? 'Có' : 'Không',
        item.PointPercentYear || '',
        item.ScoreScaleYear || '',
        item.IsApproveYear ? 'Có' : 'Không'
      ]);

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Auto fit columns
    worksheet.columns.forEach((column) => {
      column.width = 15;
    });

    // Export
    const now = new Date();
    const fileName = `TongHopKPINam_${now.getDate()}${now.getMonth() + 1}${now.getFullYear()}.xlsx`;

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    });

    this.notification.success('Thông báo', 'Xuất Excel thành công!');
  }
}
