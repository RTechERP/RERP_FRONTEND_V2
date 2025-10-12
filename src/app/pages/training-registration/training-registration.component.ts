import { TrainingRegistrationService } from './service/training-registration.service';
import { TrainingRegistrationFormComponent } from './training-registration-form/training-registration-form.component';
import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
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
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NSelectComponent } from '../n-select/n-select.component';
import 'tabulator-tables/dist/css/tabulator_simple.min.css'; // Import Tabulator stylesheet
import { CommonModule } from '@angular/common';
import { NzFormModule } from 'ng-zorro-antd/form';
import {
  type NzNotificationComponent,
  NzNotificationService,
} from 'ng-zorro-antd/notification';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { APP_LOGIN_NAME } from '../../app.config';
import { EMPLOYEE_ID } from '../../app.config';
import { ISADMIN } from '../../app.config';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UnapprovalReasonModalComponent } from './unapproval-reason-modal/unapproval-reason-modal.component';
import { AppUserService } from '../../services/app-user.service';
@Component({
  selector: 'app-training-registration',
  templateUrl: './training-registration.component.html',
  styleUrls: ['./training-registration.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzFormModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzDropDownModule,
    NzModalModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzTableModule,
    NzTabsModule,
    NzFlexModule,
    NzDrawerModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzCardModule,
  ],
})
export class TrainingRegistrationComponent implements OnInit, AfterViewInit {
  @ViewChild('tbData', { static: false }) tableElement!: ElementRef;
  @ViewChild('detailPanel', { static: false }) detailPanel!: ElementRef;
  @ViewChild('tbDetail', { static: false }) tableDetailElement!: ElementRef;
  @ViewChild('tbAppoved', { static: false }) tableApprovedElement!: ElementRef;
  @ViewChild('tbFiles', { static: false }) tableFilesElement!: ElementRef;
  table: any;
  tableDetails: any;
  sizeSearch: string = '0';
  tableApproved: any;
  tableFiles: any;
  selectedRowData: any = null;
  showDetailPanel: boolean = false;
  dataDetail: any = [];
  currentUser:any;
  constructor(
    private trainingRegistrationService: TrainingRegistrationService,
    private modalService: NgbModal,
    private notification: NzNotificationService,
    private appUserService: AppUserService
  ) {}
  filter: any;
  trainingRegistrationID: number = 0;
  ngOnInit() {
    this.filter = {
      // dateStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      dateStart:new Date(2025,0,1),
      dateEnd: new Date(),
      departmentID: 0,
      trainingCategoryID: 0,
    };
    this.currentUser = this.appUserService.currentUser;
    console.log(this.currentUser);

    this.getData();
  }
  onAddClick() {
    // let selectedrow = this.table.getSelectedRows();
    // if(selectedrow||selectedrow.length<=0){
    //   this.notification.info('Thông báo', 'Vui lòng chọn ít nhất một dòng trước khi mở form')
    // }
        let data: any = {
          LstDetail: [],
          LstFile: [],
          ID: 0,
          STT: 0,};
     this.trainingRegistrationService
      .getDetail(999999)
      .subscribe((response) => {
        if (response) {
          console.log('data', response);
          data.LstDetail = response.data;
          };
          console.log(this.dataDetail);
        }
      );

    this.openTrainingFormModal(data);
  }
  onEditClick() {
    const selectedRows = this.table.getSelectedRows();

    if (!selectedRows || selectedRows.length === 0) {
      this.notification.info(
         'Thông báo',
        'Vui lòng chọn ít nhất một dòng trước khi mở form'
      );
    } else {
      const selectedData = selectedRows[0].getData(); // nếu chỉ chọn 1 dòng, lấy dòng đầu tiên
      const dataOutput = {
        ...selectedData,
        LstDetail: this.tableDetails.getData(), // nếu bạn dùng một Tabulator khác để hiển thị chi tiết
        LstFile: this.tableFiles.getData(), // nếu bạn dùng một Tabulator khác để hiển thị file
      };
      console.log('output', dataOutput);
      this.openTrainingFormModal(dataOutput);
    }
  }

  resetFilter() {
    this.filter = {
      dateStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      dateEnd: new Date(),
      departmentID: 0,
      trainingCategoryID: 0,
    };
    this.applyFilter();
  }
  applyFilter() {
    this.getData();
  }
  ngAfterViewInit() {
    this.DrawTable();
    // Không khởi tạo bảng detail ở đây để tránh lỗi khi panel đang bị thu gọn
    // this.drawDetailTable();
    // this.drawTrainingFilesTable();
    // this.drawApprovedTable();
  }
  // getTrainingRegistrationFile() {
  //   this.trainingRegistrationService
  //     .getTrainingRegistrationFile(this.trainingRegistrationID)
  //     .subscribe((response: any) => {
  //       if (response) {
  //         console.log('res', response);
  //         this.tableFiles.setData(response.data);
  //         console.log(this.tableFiles.getData());
  //       }
  //     });
  // }
  // getTrainingRegistrationApproved() {
  //   this.trainingRegistrationService
  //     .getTrainingRegistrationApproved(this.trainingRegistrationID)
  //     .subscribe((response: any) => {
  //       if (response) {
  //         console.log('res', response);
  //         this.tableApproved.setData(response.data);
  //         console.log(this.tableApproved.getData());
  //       }
  //     });
  // }
  exportToExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Training Registration Data');
    // Đặt tiêu đề cột
    worksheet.columns = [
      { header: 'ID', key: 'ID', width: 10 },
      { header: 'STT', key: 'STT', width: 10 },
      { header: 'Cấp chứng chỉ', key: 'IsCertification', width: 20 },
      { header: 'Mã nhân viên', key: 'Code', width: 20 },
      { header: 'Tên nhân viên', key: 'FullName', width: 30 },
      { header: 'Chức vụ', key: 'ChucVu', width: 20 },
      { header: 'Phòng ban', key: 'DepartmentName', width: 20 },
      { header: 'Mục đích', key: 'Purpose', width: 20 },
      { header: 'Loại đào tạo', key: 'TypeName', width: 20 },
      { header: 'Ngày bắt đầu', key: 'DateStart', width: 20 },
      { header: 'Ngày kết thúc', key: 'DateEnd', width: 20 },
      { header: 'Số buổi / Khóa', key: 'SessionsPerCourse', width: 20 },
      { header: 'Thời gian mỗi buổi', key: 'SessionDuration', width: 20 },
      {
        header: 'Đánh giá mức độ hoàn thành',
        key: 'CompletionAssessment',
        width: 30,
      },
    ];
    // Lấy dữ liệu từ Tabulator
    const data = this.table.getData();
    // Thêm dữ liệu vào worksheet
    data.forEach((item: any) => {
      worksheet.addRow({
        ID: item.ID,
        STT: item.STT,
        IsCertification: item.IsCertification ? 'Có' : 'Không',
        Code: item.Code,
        FullName: item.FullName,
        ChucVu: item.ChucVu,
        DepartmentName: item.DepartmentName,
        Purpose: item.Purpose,
        TypeName: item.TypeName,
        DateStart: DateTime.fromJSDate(new Date(item.DateStart)).toFormat(
          'dd/MM/yyyy'
        ),
        DateEnd: DateTime.fromJSDate(new Date(item.DateEnd)).toFormat(
          'dd/MM/yyyy'
        ),
        SessionsPerCourse: item.SessionsPerCourse,
        SessionDuration: item.SessionDuration,
        CompletionAssessment: item.CompletionAssessment,
      });
    });
    // Định dạng cột ngày tháng
    worksheet.getColumn('DateStart').numFmt = 'dd/mm/yyyy';
    worksheet.getColumn('DateEnd').numFmt = 'dd/mm/yyyy';
    // Tạo file Excel và tải xuống
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const fileUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', fileUrl);
      link.setAttribute('download', 'TrainingRegistrationData.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(fileUrl);
    });
  }
  approvedTrainingRegistration(status: number, flowID:number ) {
    if (this.selectedRowData == null) {
      this.notification.info('Thông báo', 'Vui lòng chọn ít nhất một dòng trước khi duyệt');
      return;
    }

    // Nếu là hủy duyệt, hiển thị modal nhập lý do
    if (status === 2) {
      const modalRef = this.modalService.open(UnapprovalReasonModalComponent, {
        backdrop: 'static',
        keyboard: false,
        centered: true
      });

      // Truyền dữ liệu vào modal
      modalRef.componentInstance.trainingRegistrationID = this.trainingRegistrationID;

      // Xử lý kết quả trả về từ modal
      modalRef.result.then(
        (result) => {
          if (result) {
            // Lấy dữ liệu phê duyệt hiện tại
            this.trainingRegistrationService.getTrainingRegistrationApproved(this.trainingRegistrationID).subscribe(
              (response: any) => {
                if (response && response.data) {
                  const approvedData = response.data;

                  // Sắp xếp dữ liệu theo STT để đảm bảo thứ tự duyệt đúng
                  approvedData.sort((a: any, b: any) => a.STT - b.STT);

                  // Tìm bước duyệt hiện tại (bước đầu tiên chưa được duyệt)
                  const currentStepIndex = approvedData.findIndex((item: any) => item.StatusApproved === 0 || item.StatusApproved === null);

                  if (currentStepIndex === -1) {
                    this.notification.warning('Thông báo', 'Tất cả các bước đã được duyệt');
                    return;
                  }

                  // Kiểm tra các bước trước đã được duyệt chưa
                  for (let i = 0; i < currentStepIndex; i++) {
                    if (!approvedData[i]['EmployeeApprovedActualID'] || approvedData[i]['StatusApproved'] <= 0) {
                      this.notification.warning('Thông báo', `Bước ${approvedData[i].FlowName} chưa được duyệt hoặc chưa có người duyệt thực tế`);
                      return;
                    }
                  }

                  // Tiến hành hủy duyệt với lý do từ modal
                  const approvalData = {
                    trainingRegistrationID: this.trainingRegistrationID,
                    employeeApprovedID: Number(EMPLOYEE_ID),
                    employeeApprovedActualID: EMPLOYEE_ID,
                    statusApproved: status,
                    note: result.note ? `  ${result.note}` : '',
                    UnapprovedReason: result.unapprovalReason || ''
                  };

                  this.trainingRegistrationService.approveTrainingRegistration(approvalData).subscribe(
                    (response: any) => {
                      if (response.status === 1) {
                        this.notification.success('Thành công', response.message);
                        this.getTrainingRegistrationApproved();
                      } else {
                        this.notification.error('Thất bại', response.message);
                      }
                    },
                    (error) => {
                      this.notification.error('Lỗi', error.error.message);
                    }
                  );
                }
              },
              (error) => {
                this.notification.error('Lỗi', 'Không thể kiểm tra trạng thái phê duyệt: ' + error.message);
              }
            );
          }
        },
        (reason) => {
          // Modal bị đóng mà không có kết quả
          console.log('Modal dismissed with:', reason);
        }
      );
    } else {
      // Lấy dữ liệu phê duyệt hiện tại
      this.trainingRegistrationService.getTrainingRegistrationApproved(this.trainingRegistrationID).subscribe(
        (response: any) => {
          if (response && response.data) {
            const approvedData = response.data;

            // Sắp xếp dữ liệu theo STT để đảm bảo thứ tự duyệt đúng
            approvedData.sort((a: any, b: any) => a.STT - b.STT);

            // Tìm bước duyệt hiện tại (bước đầu tiên chưa được duyệt)
            const currentStepIndex = approvedData.findIndex((item: any) => item.StatusApproved === 0 || item.StatusApproved === null);

            if (currentStepIndex === -1) {
              this.notification.warning('Thông báo', 'Tất cả các bước đã được duyệt');
              return;
            }

            // Kiểm tra các bước trước đã được duyệt chưa
            for (let i = 0; i < currentStepIndex; i++) {
              if (!approvedData[i]['EmployeeApprovedActualID'] || approvedData[i]['StatusApproved'] <= 0) {
                this.notification.warning('Thông báo', `Bước ${approvedData[i].FlowName} chưa được duyệt hoặc chưa có người duyệt thực tế`);
                return;
              }
            }

            // Tiến hành duyệt nếu đủ điều kiện
            const approvalData = {
              trainingRegistrationID: this.trainingRegistrationID,
              employeeApprovedID: Number(EMPLOYEE_ID),
              employeeApprovedActualID: EMPLOYEE_ID,
              statusApproved: status,
              note: ''
            };

            this.trainingRegistrationService.approveTrainingRegistration(approvalData).subscribe(
              (response: any) => {
                if (response.status === 1) {
                  this.notification.success('Thành công', response.message);
                  this.getTrainingRegistrationApproved();
                } else {
                  this.notification.error('Thất bại', response.message);
                }
              },
              (error) => {
                this.notification.error('Lỗi', error.error.message);
              }
            );
          }
        },
        (error) => {
          this.notification.error('Lỗi', 'Không thể kiểm tra trạng thái phê duyệt: ' + error.message);
        }
      );
    }
  }
  getDetail() {
    this.trainingRegistrationService
      .getDetail(this.trainingRegistrationID)
      .subscribe((response) => {
        if (response) {
          this.dataDetail = response.data;
          if (this.tableDetails) {
            this.tableDetails.setData(this.dataDetail);
          }
        }
      });
  }

  getTrainingRegistrationFile() {
    this.trainingRegistrationService
      .getTrainingRegistrationFile(this.trainingRegistrationID)
      .subscribe((response) => {
        if (response && this.tableFiles) {
          this.tableFiles.setData(response.data);
        }
      });
  }

  getTrainingRegistrationApproved() {
    this.trainingRegistrationService
      .getTrainingRegistrationApproved(this.trainingRegistrationID)
      .subscribe((response) => {
        if (response && this.tableApproved) {
          this.tableApproved.setData(response.data);
        }
      });
  }
  private getData() {
    const param = {
      dateStart: this.filter.dateStart.toISOString(),
      dateEnd: this.filter.dateEnd.toISOString(),
      departmentID: this.filter.departmentID,
      trainingCategoryID: this.filter.trainingCategoryID,
    };

    this.trainingRegistrationService.getAll(param).subscribe((response) => {
      this.table.setData(response.data);
      console.log(response.data);
    });
  }

  public ToggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  openTrainingFormModal(selectedData: any) {
    // Mở modal
    const modalRef = this.modalService.open(TrainingRegistrationFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    // Truyền dữ liệu vào modal (nếu sửa)
    modalRef.componentInstance.dataInput = selectedData || [];

    // Xử lý kết quả trả về từ modal
    modalRef.result.then(
      (result) => {
        this.getData();
        console.log('Modal closed with:', result);
        // Refresh danh sách hoặc xử lý sau khi lưu
      },
      (reason) => {

        console.log('Modal dismissed with:', reason);
        // Xử lý khi modal bị hủy
      }
    );
  }
    private initializeDetailTables() {
    if (!this.tableDetails && this.tableDetailElement?.nativeElement) {
      this.drawDetailTable();
    }
    if (!this.tableApproved && this.tableApprovedElement?.nativeElement) {
      this.drawApprovedTable();
    }
    if (!this.tableFiles && this.tableFilesElement?.nativeElement) {
      this.drawTrainingFilesTable();
    }
  }
  private DrawTable() {
    // Khởi tạo Tabulator với cấu hình client-side pagination
    this.table = new Tabulator(this.tableElement.nativeElement, {
      layout: 'fitDataStretch',
      height: '88vh',
      pagination: true,
      paginationMode: 'local', // Sử dụng client-side pagination
      paginationSize: 25,
      paginationSizeSelector: [10, 25, 50, 100, true], // true = hiển thị tất cả
      paginationInitialPage: 1,
      columns: [
        {
          title: 'ID',
          field: 'ID',
          sorter: 'number',
          visible: false,
          headerHozAlign: 'center',
        },
        {
          title: 'STT',
          field: 'STT',
          sorter: 'number',
          width: 100,
          headerHozAlign: 'center',
          hozAlign: 'center',
        },
        {
          title: 'Cấp chứng chỉ',
          field: 'IsCertification',
          width: 150,
          headerWordWrap: true,
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked =
              value === true ||
              value === 'true' ||
              value === 1 ||
              value === '1';
            return `<input type="checkbox" ${
              checked ? 'checked' : ''
            } disabled />`;
          },
        },

        {
          title: 'Mã nhân viên',
          field: 'Code',
          sorter: 'string',
          width: 150,
          headerHozAlign: 'center',
          formatter: 'textarea',
          formatterParams: {
            maxHeight: 100,
          },
          cssClass: 'content-cell',
          hozAlign: 'left',
        },

        {
          title: 'Tên nhân viên',
          field: 'FullName',
          sorter: 'string',
          width: 150,
          headerHozAlign: 'center',
          hozAlign: 'left',
        },
        {
          title: 'Chức vụ',
          field: 'ChucVu',
          sorter: 'string',
          width: 180,
          headerHozAlign: 'center',
          formatter: 'textarea',
          formatterParams: {
            maxHeight: 100,
          },
          hozAlign: 'left',
          cssClass: 'content-cell',
        },

        {
          title: 'Phòng ban',
          field: 'DepartmentName',
          sorter: 'string',
          width: 180,
          headerHozAlign: 'center',
          hozAlign: 'left',
        },
        {
          title: 'Mục đích',
          field: 'Purpose',
          width: 200,
          headerHozAlign: 'center',
          hozAlign: 'left',
        },
        {
          title: 'Loại đào tạo',
          field: 'TypeName',
          sorter: 'string',
          width: 150,
          headerHozAlign: 'center',
          hozAlign: 'left',
        },
        {
          title: 'Ngày bắt đầu',
          field: 'DateStart',
          sorter: 'date',
          formatter(cell, formatterParams, onRendered) {
            return DateTime.fromJSDate(new Date(cell.getValue())).toFormat(
              'dd/MM/yyyy'
            );
          },
          width: 100,
          headerHozAlign: 'center',
          hozAlign: 'center',
        },
        {
          title: 'Ngày kết thúc',
          field: 'DateEnd',
          sorter: 'date',
          formatter(cell, formatterParams, onRendered) {
            return DateTime.fromJSDate(new Date(cell.getValue())).toFormat(
              'dd/MM/yyyy'
            );
          },
          width: 100,
          headerHozAlign: 'center',
          hozAlign: 'center',
        },
        {
          title: 'Số buổi / Khóa',
          field: 'SessionsPerCourse',
          width: 150,
          headerHozAlign: 'center',
          hozAlign: 'right',
        },
        {
          title: 'Thời gian mỗi buổi',
          field: 'SessionDuration',
          width: 120,
          headerHozAlign: 'center',
          hozAlign: 'right',
        },
        {
          title: 'Đánh giá mức độ hoàn thành',
          hozAlign: 'left',
          field: 'CompletionAssessment',
          width: 150,
          headerHozAlign: 'center',
        },
      ],
      initialSort: [{ column: 'ID', dir: 'asc' }],
    });
    this.table.on('rowSelectionChanged', (data: any, rows: any) => {
      if (data.length > 0) {
        this.selectedRowData = data[0];
        this.trainingRegistrationID = this.selectedRowData['ID'];
        this.showDetailPanel = true;

        // Đảm bảo panel đã mở, sau đó khởi tạo các bảng detail
        setTimeout(() => {
          this.initializeDetailTables();
          this.getDetail();
          this.getTrainingRegistrationFile();
          this.getTrainingRegistrationApproved();
        }, 0);
        console.log('Selected row:', this.selectedRowData);
      } else {
        // Không có dòng nào được chọn
        this.selectedRowData = null;
        this.showDetailPanel = false;
      }
    });

    // Sự kiện click vào dòng
    this.table.on('rowClick', (e: any, row: any) => {
      // Bỏ chọn tất cả các dòng khác
      this.table.deselectRow();
      // Chọn dòng hiện tại
      row.select();
    });
  }
  drawApprovedTable() {
    this.tableApproved = new Tabulator(
      this.tableApprovedElement.nativeElement,
      {
        height: '82.8vh',
        layout: 'fitDataStretch',
        pagination: true,
        paginationMode: 'local', // Sử dụng client-side pagination
        paginationSize: 25,
        paginationSizeSelector: [10, 25, 50, 100, true], // true = hiển thị tất cả
        paginationInitialPage: 1,
        columns: [
          {
            title: 'Flow ID',
            field: 'FlowID',
            width: 80,
            hozAlign: 'center',
            visible: false,
          },
          { title: 'STT', field: 'STT', width: 70, hozAlign: 'center' },
          {
            title: 'Mã bước duyệt',
            field: 'FlowCode',
            width: 120,
            hozAlign: 'left',
          },
          {
            title: 'Tên bước duyệt',
            field: 'FlowName',
            width: 200,
            hozAlign: 'left',
          },
          {
            title: 'Approved ID',
            field: 'ApprovedID',
            width: 100,
            hozAlign: 'center',
            visible: false,
          },
          {
            title: 'Người duyệt mặc định',
            field: 'EmployeeApproved',
            width: 180,
            hozAlign: 'left',
          },
          {
            title: 'Người duyệt thực tế',
            field: 'EmployeeApprovedActual',
            width: 180,
            hozAlign: 'left',
          },
          {
            title: 'Ngày duyệt',
            field: 'DateApproved',
            width: 180,
            hozAlign: 'center',
            formatter: function (cell) {
              const date = cell.getValue();
              return date ? DateTime.fromISO(date).toFormat('dd/MM/yyyy') : '';
            },
          },
          {
            title: 'Trạng thái',
            field: 'StatusApproved',
            width: 120,
            hozAlign: 'center',
            formatter: function (cell) {
              const status = cell.getValue();
              switch (status) {
                case 1:
                  return 'Đã duyệt';
                case 2:
                  return 'Hủy duyệt';
                default:
                  return '';
              }
            },
          },
          { title: 'Ghi chú', field: 'Note', width: 250, hozAlign: 'left' },
        ],
      }
    );
  }
  drawDetailTable() {
    this.tableDetails = new Tabulator(this.tableDetailElement.nativeElement, {
      height: '82.8vh',
      rowHeader: {
        headerSort: false,
        resizable: false,
        frozen: true,
        headerHozAlign: 'center',
        hozAlign: 'center',
        formatter: 'rowSelection',
        titleFormatter: 'rowSelection',
        cellClick: function (e: any, cell: any) {
          cell.getRow().toggleSelect();
        },
      },
      layout: 'fitDataStretch',
      columns: [
        { title: 'STT', field: 'STT', width: 70, hozAlign: 'center' },
        { title: 'ID', field: 'ID', width: 70, hozAlign: 'center', visible: false },
        {
          title: 'Hạng mục',
          field: 'CategoryName',
          width: 150,
          hozAlign: 'left',
        },
        {
          title: 'Diễn giải',
          field: 'Explaination',
          width: 200,
          hozAlign: 'left',
        },
        { title: 'Ghi chú', field: 'Note', width: 200, hozAlign: 'left' },
      ],
    });
  }
  drawTrainingFilesTable() {
    this.tableFiles = new Tabulator(this.tableFilesElement.nativeElement, {
      height: '82.8vh',
      layout: 'fitDataStretch',
      columns: [
        {
          title: 'ID',
          field: 'ID',
          width: 70,
          hozAlign: 'center',
          visible: false,
        },
        { title: 'Tên file', field: 'FileName', width: 200, hozAlign: 'left' },
        {
          title: 'Đường dẫn',
          field: 'ServerPath',
          width: 300,
          hozAlign: 'left',
          formatter: function (cell) {
            const url = cell.getValue();
            return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
          },
          visible: false,
        },
        {
          title: 'Tên file gốc',
          field: 'OriginName',
          width: 200,
          visible: false,
        },
      ],
    });
  }
}
