import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { EmployeeService } from '../employee-service/employee.service';
import { DepartmentServiceService } from '../../department/department-service/department-service.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  GridOption
} from 'angular-slickgrid';

@Component({
  selector: 'app-employee-contact',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzInputModule,
    NzIconModule,
    NzSplitterModule,
    NzSelectModule,
    AngularSlickgridModule,
  ],
  templateUrl: './employee-contact.component.html',
  styleUrl: './employee-contact.component.css'
})
export class EmployeeContactComponent implements OnInit, AfterViewInit {
  // SlickGrid
  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];

  keyword: string = '';
  departmentId: number = 0;
  departments: any[] = [];
  viewMode: 'table' | 'card' = 'table';
  isPermissDownload = false;
  contactData: any[] = [];
  totalEmployees: number = 0;

  constructor(
    private employeeService: EmployeeService,
    private departmentService: DepartmentServiceService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    this.initGrid();
    this.loadDepartments();
  }

  ngAfterViewInit(): void {
    this.loadContactData();
  }

  /**
   * Load dữ liệu liên hệ nhân viên
   */
  loadContactData(): void {
    this.employeeService.getAllContact(this.departmentId, this.keyword).subscribe({
      next: (response: any) => {
        const data = response?.data || {};
        this.contactData = data.list || [];
        this.isPermissDownload = Boolean(data.isPermissDownload);
        this.totalEmployees = this.contactData.length;
        
        this.dataset = this.contactData.map((item, index) => ({
          ...item,
          id: item.ID || index + 1,
          STT: index + 1
        }));
      },
      error: (err: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải dữ liệu: ' + (err?.error?.message || err?.message)
        );
      }
    });
  }

  /**
   * Tìm kiếm theo từ khóa
   */
  onSearch(): void {
    this.loadContactData();
  }

  loadDepartments(): void {
    this.departmentService.getDepartments().subscribe({
      next: (res: any) => {
        this.departments = res?.data || [];
      },
      error: (err: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách phòng ban: ' + (err?.error?.message || err?.message)
        );
      }
    });
  }

  onViewModeChange(mode: 'table' | 'card'): void {
    this.viewMode = mode;
    if (mode === 'table') {
      // Đảm bảo grid được render lại khi chuyển về table mode
      setTimeout(() => {
        if (this.angularGrid?.resizerService) {
          this.angularGrid.resizerService.resizeGrid();
        }
        // Force re-render grid
        if (this.angularGrid?.slickGrid) {
          this.angularGrid.slickGrid.invalidate();
          this.angularGrid.slickGrid.render();
        }
      }, 100);
    }
  }

  /**
   * Khởi tạo SlickGrid
   */
  private initGrid(): void {
    const formatDate = (row: number, cell: number, value: any) => {
      if (!value) return '';
      try {
        const dateValue = DateTime.fromISO(value);
        return dateValue.isValid ? dateValue.toFormat('dd/MM/yyyy') : value;
      } catch (e) {
        return value;
      }
    };

    const formatYear = (row: number, cell: number, value: any) => {
      if (!value) return '';
      try {
        const dateValue = DateTime.fromISO(value);
        return dateValue.isValid ? dateValue.toFormat('yyyy') : value;
      } catch (e) {
        return value;
      }
    };

    const phoneFormatter = (row: number, cell: number, value: any) => {
      if (!value) return '';
      const list = String(value).split('\n');
      return list.map((p: string) => `<a href="tel:${p.trim()}">${p}</a>`).join('<br/>');
    };

    this.columnDefinitions = [
      { id: 'STT', name: 'STT', field: 'STT', width: 60, sortable: true},
      { id: 'Code', name: 'Mã NV', field: 'Code', width: 100, sortable: true, filterable: true },
      { id: 'FullName', name: 'Họ tên', field: 'FullName', width: 200, sortable: true, filterable: true },
      { id: 'DepartmentName', name: 'Phòng ban', field: 'DepartmentName', width: 180, sortable: true, filterable: true },
      { id: 'ChucVu', name: 'Chức vụ', field: 'ChucVu', width: 200, sortable: true, filterable: true },
      { id: 'SDTCaNhan', name: 'Điện thoại', field: 'SDTCaNhan', width: 150, formatter: phoneFormatter, filterable: true },
      { id: 'EmailCongTy', name: 'Email', field: 'EmailCongTy', width: 250, sortable: true, filterable: true },
      { id: 'StartWorking', name: 'Ngày vào', field: 'StartWorking', width: 100, sortable: true, formatter: formatDate, },
      { id: 'BirthOfDate', name: 'Năm sinh', field: 'BirthOfDate', width: 90, sortable: true, formatter: formatYear },
    ];

    this.gridOptions = {
      autoResize: {
        container: '#grid-container-contact',
        calculateAvailableSizeBy: 'container'
      },
      enableAutoResize: true,
      gridWidth: '100%',
     forceFitColumns: true,
      enableCellNavigation: true,
      
      enableFiltering: true,
     
      rowHeight: 35,
      headerRowHeight: 40,
      datasetIdPropertyName: 'id',
      enableGrouping: true,
     
    };
  }

  angularGridReady(angularGrid: AngularGridInstance): void {
    this.angularGrid = angularGrid;
    
    // Setup grouping by DepartmentName và EmployeeTeamName
    if (angularGrid && angularGrid.dataView) {
     angularGrid.dataView.setGrouping([
  {
    getter: 'DepartmentName',
    comparer: () => 0, 
    formatter: (g: any) => {
      const deptName = g.value || 'Chưa phân phòng';
      return `Phòng ban: ${deptName}
        <span style="color:green; margin-left:10px;">
          (${g.count} nhân viên)
        </span>`;
    }
  },
  {
    getter: 'EmployeeTeamName',
    comparer: () => 0, 
    formatter: (g: any) => {
      const teamName = g.value || '';
      return `Team: ${teamName}
        <span style="color:blue; margin-left:10px;">
          (${g.count} nhân viên)
        </span>`;
    }
  }
]);
    }
  }

  /**
   * Xuất Excel
   */
  onExportExcel(): void {
    if (!this.dataset.length) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('THÔNG TIN LIÊN HỆ');

    const columns = this.columnDefinitions.filter(c => c.field && c.field.trim() !== '');

    worksheet.addRow(columns.map(c => c.name || c.field || ''));
    this.dataset.forEach(row => {
      worksheet.addRow(
        columns.map(c => {
          const val = row[c.field!];
          switch (c.field) {
            case 'StartWorking':
              return val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : '';
            case 'BirthOfDate':
              return val ? DateTime.fromISO(val).toFormat('yyyy') : '';
            default:
              return val ?? '';
          }
        })
      );
    });

    worksheet.columns.forEach(col => {
      col.width = 20;
    });

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        if (rowNumber === 1) {
          cell.font = { bold: true };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });

    const currentMonth = DateTime.now().toFormat('MM-yy');
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DanhSachLienHeNhanVien_T${currentMonth}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
