import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalService } from 'ng-zorro-antd/modal';
import {
  AfterViewInit,
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  Input,
} from '@angular/core';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCardModule } from 'ng-zorro-antd/card';
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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import {
  TabulatorFull as Tabulator,
  CellComponent,
  ColumnDefinition,
  RowComponent,
} from 'tabulator-tables';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';

declare var bootstrap: any;
import { updateCSS } from 'ng-zorro-antd/core/util';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { MeetingMinuteService } from './meeting-minute-service/meeting-minute.service';
import { MeetingMinuteFormComponent } from './meeting-minute-form/meeting-minute-form.component';
import { ChangeDetectorRef } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { format, isValid, parseISO } from 'date-fns';

interface MeetingMinutes {
  STT: number;
  ProjectCode: string;
  ProjectName: string;
  ProjectID: string;
  Title: string;
  TypeName: string;
  DateStart: Date | null;
  DateEnd: Date | null;
  Place: string;
}

interface Employee {
  EmployeeID: number;
  FullName: string;
  UserTeamID: string;
  Section: string;
}

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
@Component({
  selector: 'app-meeting-minute',
  standalone: true,
  imports: [
    CommonModule,
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
    NzTabsModule,
    NzUploadModule,
    NzModalModule,
    NgbModalModule,
    NzFormModule,
    NzInputNumberModule,
  ],
  templateUrl: './meeting-minute.component.html',
  styleUrl: './meeting-minute.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MeetingMinuteComponent implements OnInit, AfterViewInit {
  newMeetingMinutes: MeetingMinutes = {
    STT: 0,
    ProjectCode: '',
    ProjectName: '',
    ProjectID: '',
    Title: '',
    TypeName: '',
    DateStart: null,
    DateEnd: null,
    Place: '',
  };

  newEmployee: Employee = {
    EmployeeID: 0,
    FullName: '',
    UserTeamID: '',
    Section: '',
  };

  tabs = [1, 2, 3];

  searchParams = {
    DateStart: new Date(),
    DateEnd: new Date(),
    Keywords: '',
    MeetingTypeID: 0,
  };

  Status: number = 0;
  EmployeeID: number = 0;

  meetingTypeTable: Tabulator | null = null;
  meetingTypeData: any[] = [];
  sizeSearch: string = '0';

  meetingTypeGroupsData: any[] = [];

  meetingMinutesData: any[] = [];
  meetingMinutesTable: Tabulator | null = null;
  data: any[] = [];
  MeetingMinutesID: number = 0;

  dateFormat = 'dd/MM/yyyy';

  employeeTable: Tabulator | null = null;
  employeeData: any[] = [];

  employeeContentTable: Tabulator | null = null;
  employeeContentData: any[] = [];

  customerTable: Tabulator | null = null;
  customerData: any[] = [];
  activeTab = 0;

  customerContentTable: Tabulator | null = null;
  customerContentData: any[] = [];

  isCheckmode: boolean = false;

  @ViewChild('employeeContentTable', { static: true }) tableRef!: ElementRef;
  // Trong constructor, thêm ChangeDetectorRef
  constructor(
    private notification: NzNotificationService,
    private meetingMinuteService: MeetingMinuteService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private cdr: ChangeDetectorRef // Thêm ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getMeetingTypeGroup();
    this.getMeetingMinutes();
    const startDate = this.searchParams.DateStart;
    startDate.setMonth(startDate.getMonth() - 1);
    const endDate = this.searchParams.DateEnd;
    const startDateConverted = this.toLocalISOString(startDate);
  }

  ngAfterViewInit(): void {
    this.draw_MeetingMinutesTable();
    this.draw_employeeTable();
    //this.draw_employeeContentTable();
    this.draw_customerTable();
    setTimeout(() => {
      this.onTabChange(0);
    }, 100);
  }


  onTabChange(index: number) {
    this.activeTab = index;
    // Initialize tables when tabs become active
    setTimeout(() => {
      if (index === 1 && !this.employeeContentTable) {
        this.draw_employeeContentTable();
      }
      this.cdr.detectChanges();
    }, 100);
  }

  onCustomerTabChange(index: number) {
    // Initialize customer content table when tab becomes active
    setTimeout(() => {
      if (index === 1 && !this.customerContentTable) {
        this.draw_customerContentTable();
      }
      this.cdr.detectChanges();
    }, 100);
  }

  getMeetingType() {
    this.meetingMinuteService
      .getDataMeetingType()
      .subscribe((response: any) => {
        this.meetingTypeData = response.data || [];
        if (this.meetingTypeTable) {
          this.meetingTypeTable.setData(this.meetingTypeData);
        }
      });
  }

  getGroupName(groupId: number): string {
    switch (groupId) {
      case 1:
        return 'Khách hàng';
      case 2:
        return 'Nội bộ';
      default:
        return 'Khác';
    }
  }

  toLocalISOString(date: Date | string): string {
    // Chuyển đổi chuỗi thành Date nếu cần
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Kiểm tra xem dateObj có hợp lệ không
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      throw new Error('Invalid date input');
    }

    const tzOffset = 7 * 60; // GMT+7, tính bằng phút
    const adjustedDate = new Date(dateObj.getTime() + tzOffset * 60 * 1000); // Điều chỉnh sang GMT+7
    const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');

    return (
      adjustedDate.getUTCFullYear() +
      '-' +
      pad(adjustedDate.getUTCMonth() + 1) +
      '-' +
      pad(adjustedDate.getUTCDate()) +
      'T' +
      pad(adjustedDate.getUTCHours()) +
      ':' +
      pad(adjustedDate.getUTCMinutes()) +
      ':' +
      pad(adjustedDate.getUTCSeconds())
    ); // Trả về định dạng YYYY-MM-DDTHH:mm:ss
  }

  getMeetingTypeGroup() {
    this.meetingMinuteService.getDataGroupID().subscribe((response: any) => {
      this.meetingTypeGroupsData = response.data || [];
    });
  }

  getMeetingMinutes() {
    const DateStart = DateTime.fromJSDate(
      new Date(this.searchParams.DateStart)
    );
    const DateEnd = DateTime.fromJSDate(new Date(this.searchParams.DateEnd));
    this.meetingMinuteService
      .getMeetingMinutes(
        this.searchParams.Keywords,
        this.toLocalISOString(this.searchParams.DateStart),
        this.toLocalISOString(this.searchParams.DateEnd),
        this.searchParams.MeetingTypeID
      )
      .subscribe((response: any) => {
        this.meetingMinutesData = response.data?.asset || [];
        if (this.meetingMinutesTable) {
          this.meetingMinutesTable.setData(this.meetingMinutesData);
        } else {
          this.draw_MeetingMinutesTable();
        }
        // Nếu có dòng được chọn, load lại chi tiết
        if (this.MeetingMinutesID) {
          this.getMeetingMinutesDetailsByID(this.MeetingMinutesID);
        }
      });
  }

  // getEmployee() {
  //   this.meetingMinuteService.getEmployee(this.Status).subscribe((response: any) => {
  //     console.log("response trả ra nè:", response)
  //     this.employeeData = response.data?.asset || [];
  //     if(this.employeeTable) {
  //       this.employeeTable.setData(this.employeeData);
  //     }else {
  //       this.draw_employeeTable();
  //     }
  //   })
  // }

  getMeetingMinutesDetailsByID(ID: number) {
    this.meetingMinuteService
      .getMeetingMinutesDetailsByID(ID)
      .subscribe((response: any) => {
        console.log('Response từ server:', response);

        // Dữ liệu nhân viên
        this.employeeData = response.data?.employeeDetails || [];
        if (this.employeeTable) {
          this.employeeTable.setData(this.employeeData);
        } else {
          this.draw_employeeTable();
        }

        // Dữ liệu nội dung nhân viên
        this.employeeContentData = response.data?.employeeAttendance || [];
        if (this.employeeContentTable) {
          this.employeeContentTable.setData(this.employeeContentData);
        } else {
          if (this.activeTab === 1) {
            this.draw_employeeContentTable();
          }
        }

        // Dữ liệu khách hàng
        this.customerData = response.data?.customerAttendance || [];
        if (this.customerTable) {
          this.customerTable.setData(this.customerData);
        } else {
          this.draw_customerTable();
        }

        // Dữ liệu nội dung khách hàng
        this.customerContentData = response.data?.customerDetails || [];
        if (this.customerContentTable) {
          this.customerContentTable.setData(this.customerContentData);
        } else {
          // Bảng sẽ được vẽ khi user click vào tab "Nội dung" của khách hàng
          // Thông qua onCustomerTabChange method
        }
        
      });
  }
  resetform() {}

  searchData() {
    this.getMeetingMinutes();
    // Nếu tab nội dung đang được chọn, đảm bảo load lại bảng con
    if (this.activeTab === 1 && this.MeetingMinutesID) {
      this.getMeetingMinutesDetailsByID(this.MeetingMinutesID);
    }
  }
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  onAddMeetingMinutes(isEditmode: boolean) {
    this.isCheckmode = isEditmode;
    console.log('is', this.isCheckmode);
    if (this.isCheckmode == true && this.MeetingMinutesID === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn 1 bản ghi để sửa!');
      return;
    }
    const modalRef = this.modalService.open(MeetingMinuteFormComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.newMeetingMinutes = this.newMeetingMinutes;
    modalRef.componentInstance.isCheckmode = this.isCheckmode;
    modalRef.componentInstance.MeetingMinutesID = this.MeetingMinutesID;
    modalRef.componentInstance.newEmployee = this.newEmployee;

    modalRef.result
      .then((result) => {
        if (result == true) {
          this.getMeetingMinutes();
          //  this.getKPICriteriaDetailByID();
          this.draw_MeetingMinutesTable();
        }
      })
      .catch(() => {});
  }

  onDeleteMeetingMinutes() {
    const dataSelect: MeetingMinutes[] =
      this.meetingMinutesTable!.getSelectedData();
    console.log('ban ghi xoa', dataSelect);
    const payloads = {
      MeetingMinute: {
        ...dataSelect[0],
        IsDeleted: true,
        UpdatedBy: 'admin',
        UpdatedDate: new Date(),
      },
      MeetingMinutesDetail: [],
      MeetingMinutesAttendance: [],
      DeletedMeetingMinutesAttendance: [],
      DeletedMeetingMinutesDetails: [],
    };

    if (dataSelect.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn ít nhất một bản ghi để xóa!'
      );
      return;
    }
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${dataSelect[0].Title} không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.meetingMinuteService.saveData(payloads).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.notification.success('Thông báo', 'Đã xóa thành công!');
              this.getMeetingMinutes();
            } else {
              this.notification.warning(
                'Thông báo',
                res.message || 'Không thể xóa bản ghi này!'
              );
            }
          },
          error: (err) => {
            this.notification.error('Thông báo', 'Có lỗi xảy ra khi xóa!');
            console.error(err);
          },
        });
      },
    });
  }

  async exportExcel() {
    console.log('Export Excel');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách biên bản cuộc họp');

    // === Định nghĩa style ===
    const titleStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, size: 16, color: { argb: 'FF000000' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
    };

    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E90FF' },
      },
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      },
    };

    const cellStyle: Partial<ExcelJS.Style> = {
      font: { size: 11 },
      alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      },
    };

    // === Tiêu đề chính ===
    worksheet.mergeCells('A1:J1');
    const mainTitle = worksheet.getCell('A1');
    mainTitle.value = 'DANH SÁCH BIÊN BẢN CUỘC HỌP';
    mainTitle.style = titleStyle;

    // === Ngày xuất file ===
    worksheet.mergeCells('A2:J2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`;
    dateCell.style = {
      font: { italic: true, size: 11 },
      alignment: { horizontal: 'center' },
    };

    let currentRow = 4;

    // === Hàm appendTable ===
    const appendTable = (title: string, table: any, data: any[]) => {
      console.log(
        `Processing table: ${title}, Data length: ${data?.length ?? 0}`
      ); // Debugging log
      if (!table || !data || !Array.isArray(data) || data.length === 0) {
        console.warn(
          `Skipping table "${title}" due to missing table or empty data`
        );
        return; // Skip if table or data is invalid
      }

      // Section title
      worksheet.mergeCells(`A${currentRow}:J${currentRow}`);
      const titleCell = worksheet.getCell(`A${currentRow}`);
      titleCell.value = `=== ${title} ===`;
      titleCell.style = {
        font: { bold: true, size: 13, color: { argb: 'FF000000' } },
        alignment: { horizontal: 'left' },
      };
      currentRow += 2;

      // Header
      const columns = table.getColumns().slice(1);
      const headers = [
        'STT',
        ...columns.map((col: any) => col.getDefinition().title),
      ];
      const headerRow = worksheet.addRow(headers);

      // Style header
      headers.forEach((_, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.style = headerStyle;
      });
      currentRow++;

      // Định dạng cột
      const columnWidths: number[] = headers.map(() => 10); // Độ rộng tối thiểu
      worksheet.columns = headers.map((_, index) => ({
        width: 10, // Độ rộng mặc định
      }));

      // Data
      data.forEach((row: any, index: number) => {
        const rowData = [
          index + 1,
          ...columns.map((col: any) => {
            const field = col.getField();
            let value = row[field];

            // Robust date handling
            if (typeof value === 'string' && value.match(/\d{4}-\d{2}-\d{2}/)) {
              try {
                const parsedDate = parseISO(value); // Use date-fns for parsing
                if (isValid(parsedDate)) {
                  return format(parsedDate, 'dd/MM/yyyy');
                }
              } catch (error) {
                console.warn(
                  `Invalid date format for value: ${value} in field: ${field}`
                );
              }
            }
            // Format boolean
            if (field === 'IsApproved') {
              value = value === true ? '✓' : '';
            }
            return value || ''; // Fallback to empty string for null/undefined
          }),
        ];

        const dataRow = worksheet.addRow(rowData);

        // Style và tính toán độ rộng cột
        rowData.forEach((value, idx) => {
          const cell = dataRow.getCell(idx + 1);
          cell.style =
            typeof value === 'object' && value.style ? value.style : cellStyle;

          // Tính độ rộng cột dựa trên nội dung
          const contentLength = String(
            value && typeof value === 'object' ? value.value : value
          ).length;
          columnWidths[idx] = Math.max(
            columnWidths[idx],
            Math.min(contentLength + 2, 50)
          );
        });
        currentRow++;
      });

      // Áp dụng độ rộng cột
      worksheet.columns.forEach((column, index) => {
        column.width = columnWidths[index];
      });

      currentRow += 2; // Dòng trống
    };

    // === Gọi appendTable cho từng bảng ===
    const tables = [
      {
        title: 'Biên bản họp',
        table: this.meetingMinutesTable,
        data: this.meetingMinutesTable?.getSelectedData() ?? [],
      },
      {
        title: 'Nhân viên tham gia',
        table: this.employeeTable,
        data: this.employeeTable?.getData() ?? [],
      },
      {
        title: 'Khách hàng',
        table: this.customerTable,
        data: this.customerTable?.getData() ?? [],
      },
      {
        title: 'Chi tiết nhân viên',
        table: this.employeeContentTable,
        data: this.employeeContentTable?.getData() ?? [],
      },
      {
        title: 'Chi tiết khách hàng',
        table: this.customerContentTable,
        data: this.customerContentTable?.getData() ?? [],
      },
    ];

    tables.forEach(({ title, table, data }) => {
      appendTable(title, table, data);
    });

    // === Căn chỉnh chiều cao hàng ===
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 2) {
        row.height = 25; // Chiều cao mặc định cho các hàng
      }
    });

    // === Xuất file ===
    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `DanhSachBienBanCuocHop_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error exporting Excel file:', error);
    }
  }

  private draw_MeetingMinutesTable(): void {
    if (this.meetingMinutesTable) {
      this.meetingMinutesTable.setData(this.meetingMinutesData);
    } else {
      this.meetingMinutesTable = new Tabulator('#MeetingMinutes', {
        ...DEFAULT_TABLE_CONFIG,
        data: this.meetingMinutesData,
        layout: 'fitDataStretch',
        pagination:false,
        selectableRows: 1,
        height: '40vh',
        movableColumns: true,
        reactiveData: true,
        placeholder: 'Không có dữ liệu',
        addRowPos: 'bottom',
        history: true,
        rowHeader: {
          headerSort: false,
          resizable: false,
          frozen: true,
          formatter: 'rowSelection',
          headerHozAlign: 'center',
          hozAlign: 'center',
          titleFormatter: 'rowSelection',
          cellClick: (e: any, cell: any) => {
            e.stopPropagation();
          },
        },
        columns: [
          {
            title: 'STT',
            hozAlign: 'center',
            headerHozAlign: 'center',
            field: 'STT',
          },
          { title: 'Mã dự án', field: 'ProjectCode', headerHozAlign: 'center' },
          {
            title: 'Tên dự án',
            field: 'ProjectName',
            headerHozAlign: 'center',
          },
          {
            title: 'Tiêu đề',
            field: 'Title',
            headerHozAlign: 'center',
          },
          {
            title: 'Loại cuộc họp',
            field: 'TypeName',
            headerHozAlign: 'center',
          },
          {
            title: 'Ngày bắt đầu',
            field: 'DateStart',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: 150,
            formatter: (cell: any) => {
              const value = cell.getValue();
              return value
                ? DateTime.fromISO(value).toFormat('dd/MM/yyyy')
                : '';
            },
          },
          {
            title: 'Ngày kết thúc',
            field: 'DateEnd',
            hozAlign: 'left',
            headerHozAlign: 'center',
            width: 150,
            formatter: (cell: any) => {
              const value = cell.getValue();
              return value
                ? DateTime.fromISO(value).toFormat('dd/MM/yyyy')
                : '';
            },
          },
          {
            title: 'Địa điểm',
            field: 'Place',
            headerHozAlign: 'center',
          },
        ],
      });
      this.meetingMinutesTable.on(
        'rowClick',
        (e: UIEvent, row: RowComponent) => {
          const rowData = row.getData();
          console.log('row nè: ', rowData);
          // Nếu cần dùng property riêng của chuột thì ép kiểu:
          const mouseEvent = e as MouseEvent;
          console.log(mouseEvent.clientX, mouseEvent.clientY);
          this.getMeetingMinutesDetailsByID(rowData['ID']);
          console.log('Status của row:', rowData['ID']);
        }
      );
      // THÊM SỰ KIỆN rowSelected VÀ rowDeselected
      this.meetingMinutesTable.on('rowSelected', (row: RowComponent) => {
        const rowData = row.getData();
        this.data = [rowData]; // Giả sử bạn luôn muốn this.data chứa mảng 1 phần tử
        this.MeetingMinutesID = this.data[0].ID;
        console.log('Selected Row Data: ', this.data);
      });
      this.meetingMinutesTable.on('rowDeselected', (row: RowComponent) => {
        const selectedRows = this.meetingMinutesTable!.getSelectedRows();
        this.MeetingMinutesID = 0;
        if (selectedRows.length === 0) {
          this.data = []; // Reset data về mảng rỗng
        }
      });
    }
  }

  private draw_employeeTable(): void {
    if (this.employeeTable) {
      this.employeeTable.setData(this.employeeData);
    } else {
      this.employeeTable = new Tabulator('#Employee', {
        data: this.employeeData,
        layout: 'fitDataStretch',
        // pagination: true,
        selectableRows: 1,
        height: '40vh',
        movableColumns: true,
        // paginationSize: 30,
        // paginationSizeSelector: [5, 10, 20, 50, 100],
        reactiveData: true,
        placeholder: 'Không có dữ liệu',
        addRowPos: 'bottom',
        history: true,
        rowHeader: {
          headerSort: false,
          resizable: false,
          frozen: true,
          formatter: 'rowSelection',
          headerHozAlign: 'center',
          hozAlign: 'center',
          titleFormatter: 'rowSelection',
          cellClick: (e: any, cell: any) => {
            e.stopPropagation();
          },
        },
        columns: [
          {
            title: 'Mã nhân viên',
            hozAlign: 'center',
            headerHozAlign: 'center',
            field: 'Code',
          },
          {
            title: 'Tên nhân viên',
            field: 'FullName',
            headerHozAlign: 'center',
          },
          {
            title: 'Team',
            field: 'Name',
            headerHozAlign: 'center',
          },
          {
            title: 'Chức vụ',
            field: 'Section',
            headerHozAlign: 'center',
          },
        ],
      });
      // THÊM SỰ KIỆN rowSelected VÀ rowDeselected
      this.employeeTable.on('rowSelected', (row: RowComponent) => {
        const rowData = row.getData();
        this.data = [rowData]; // Giả sử bạn luôn muốn this.data chứa mảng 1 phần tử
        this.EmployeeID = this.data[0].ID;
        console.log('Selected Row Data: ', this.data);
      });
      this.employeeTable.on('rowDeselected', (row: RowComponent) => {
        const selectedRows = this.employeeTable!.getSelectedRows();
        this.EmployeeID = 0;
        if (selectedRows.length === 0) {
          this.data = []; // Reset data về mảng rỗng
        }
      });
    }
  }

  private draw_employeeContentTable(): void {
    if (!document.getElementById('EmployeeContentNE')) {
      console.error('Phần tử #EmployeeContentNE không tồn tại trong DOM');
      return;
    }

    if (this.employeeContentTable) {
      this.employeeContentTable.setData(this.employeeContentData);
    } else {
      this.employeeContentTable = new Tabulator('#EmployeeContentNE', {
        data: this.employeeContentData,
        layout: 'fitDataStretch',
        selectableRows: 1,
        height: '40vh',
        movableColumns: true,
        reactiveData: true,
        placeholder: 'Không có dữ liệu',
        addRowPos: 'bottom',
        history: true,
        rowHeader: {
          headerSort: false,
          resizable: false,
          frozen: true,
          formatter: 'rowSelection',
          headerHozAlign: 'center',
          hozAlign: 'center',
          titleFormatter: 'rowSelection',
          cellClick: (e: any, cell: any) => {
            e.stopPropagation();
          },
        },
        columns: [
          {
            title: 'Nội dung',
            hozAlign: 'center',
            headerHozAlign: 'center',
            field: 'DetailContent',
          },
          { title: 'Kết quả', field: 'DetailResult', headerHozAlign: 'center' },
          {
            title: 'Mã nhân viên',
            field: 'EmployeeID',
            headerHozAlign: 'center',
          },
          {
            title: 'Người phụ trách',
            field: 'CustomerName',
            headerHozAlign: 'center',
          },
          {
            title: 'Số điện thoại',
            field: 'PhoneNumber',
            headerHozAlign: 'center',
          },
          {
            title: 'Kế hoạch',
            field: 'PlanDate',
            headerHozAlign: 'center',
          },
          {
            title: 'Ghi chú',
            field: 'Note',
            headerHozAlign: 'center',
          },
          {
            title: 'Phát sinh',
            field: 'ProjectHistoryProblemID',
            headerHozAlign: 'center',
          },
        ],
      });
      console.log(
        'Bảng employeeContentTable được khởi tạo với dữ liệu:',
        this.employeeContentData
      );
    }
  }

  private draw_customerTable(): void {
    if (this.customerTable) {
      this.customerTable.setData(this.customerData);
    } else {
      this.customerTable = new Tabulator('#Customer', {
        data: this.customerData,
        layout: 'fitDataStretch',
        // pagination: true,
        selectableRows: 1,
        height: '40vh',
        movableColumns: true,
        // paginationSize: 30,
        // paginationSizeSelector: [5, 10, 20, 50, 100],
        reactiveData: true,
        placeholder: 'Không có dữ liệu',
        addRowPos: 'bottom',
        history: true,
        rowHeader: {
          headerSort: false,
          resizable: false,
          frozen: true,
          formatter: 'rowSelection',
          headerHozAlign: 'center',
          hozAlign: 'center',
          titleFormatter: 'rowSelection',
          cellClick: (e: any, cell: any) => {
            e.stopPropagation();
          },
        },
        columns: [
          {
            title: 'Tên khách hàng',
            hozAlign: 'center',
            headerHozAlign: 'center',
            field: 'FullName',
          },
          {
            title: 'Số điện thoại',
            field: 'PhoneNumber',
            headerHozAlign: 'center',
          },
          {
            title: 'Email',
            field: 'EmailCustomer',
            headerHozAlign: 'center',
          },
          {
            title: 'Địa chỉ',
            field: 'AddressCustomer',
            headerHozAlign: 'center',
          },
        ],
      });
    }
  }

  private draw_customerContentTable(): void {
    if (this.customerContentTable) {
      this.customerContentTable.setData(this.customerContentData);
    } else {
      this.customerContentTable = new Tabulator('#CustomerContent', {
        data: this.customerContentData,
        layout: 'fitDataStretch',
        // pagination: true,
        selectableRows: 1,
        height: '40vh',
        movableColumns: true,
        // paginationSize: 30,
        // paginationSizeSelector: [5, 10, 20, 50, 100],
        reactiveData: true,
        placeholder: 'Không có dữ liệu',
        addRowPos: 'bottom',
        history: true,
        rowHeader: {
          headerSort: false,
          resizable: false,
          frozen: true,
          formatter: 'rowSelection',
          headerHozAlign: 'center',
          hozAlign: 'center',
          titleFormatter: 'rowSelection',
          cellClick: (e: any, cell: any) => {
            e.stopPropagation();
          },
        },
        columns: [
          {
            title: 'Nội dung',
            hozAlign: 'center',
            headerHozAlign: 'center',
            field: 'DetailContent',
          },
          { title: 'Kết quả', field: 'DetailResult', headerHozAlign: 'center' },
          {
            title: 'Họ tên',
            field: 'CustomerName',
            headerHozAlign: 'center',
          },
          {
            title: 'Số điện thoại',
            field: 'PhoneNumber',
            headerHozAlign: 'center',
          },
          {
            title: 'Kế hoạch',
            field: 'PlanDate',
            headerHozAlign: 'center',
          },
          {
            title: 'Ghi chú',
            field: 'Note',
            headerHozAlign: 'center',
          },
          {
            title: 'Phát sinh',
            field: 'ProjectHistoryProblemID',
            headerHozAlign: 'center',
          },
        ],
      });
      console.log(
        'Bảng customerContentTable được khởi tạo với dữ liệu:',
        this.customerContentData
      );
    }
  }
}
