import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ApproveTpService, ApproveByApproveTPRequestParam, ApproveRequestParam, ApproveItemParam } from '../approve-tp-service/approve-tp.service';
import { AuthService } from '../../../../auth/auth.service';
import { ProjectService } from '../../../project/project-service/project.service';
import { ProposeVehicleRepairService } from '../../../hrm/vehicle/propose-vehicle-repair/propose-vehicle-repair/propose-vehicle-repair-service/propose-vehicle-repair.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-approve-tp',
  templateUrl: './approve-tp.component.html',
  styleUrls: ['./approve-tp.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzNotificationModule,
    ReactiveFormsModule,
    NzSplitterModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzGridModule,
    NzSpinModule,
    NzModalModule,
    NzDropDownModule,
    NzMenuModule,
  ]
})
export class ApproveTpComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_approve_tp', { static: false }) tbApproveTpRef!: ElementRef<HTMLDivElement>;

  private tabulator!: Tabulator;
  searchForm!: FormGroup;
  employeeList: any[] = [];
  teamList: any[] = [];
  exportingExcel = false;
  loadingData = false;
  sizeSearch: string = '0';
  currentUser: any = null;
  isSenior: boolean = false;
  isBGD: boolean = false;

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private approveTpService: ApproveTpService,
    private authService: AuthService,
    private projectService: ProjectService,
    private modal: NzModalService
  ) { }

  ngOnInit() {
    this.initializeForm();
    this.getCurrentUser();
    this.loadTeams();
    this.loadEmployees();
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '20%' : '0';
  }

  getCurrentUser() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      if (res && res.status === 1 && res.data) {
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        this.currentUser = data;
        this.isBGD = (data?.DepartmentID == 1 && data?.EmployeeID != 54) || data?.IsAdmin;
        this.isSenior = false; // Set based on your logic
        
        // Set IDApprovedTP based on user role
        const idApprovedTP = !this.isSenior ? (data?.EmployeeID || 0) : 0;
        if (this.searchForm) {
          this.searchForm.patchValue({
            IDApprovedTP: idApprovedTP
          });
        }
        
        // Reload table after getting current user
        if (this.tabulator) {
          this.loadData();
        }
      }
    });
  }

  loadTeams() {
    const currentYear = DateTime.now().year;
    const currentQuarter = Math.floor((DateTime.now().month - 1) / 3) + 1;
    const departmentID = 0; // Tất cả phòng ban
    
    this.approveTpService.getKPIEmployeeTeams(currentYear, currentQuarter, departmentID).subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          const teams = Array.isArray(response.data) ? response.data : [];
          // Thêm option "Tất cả các Team" vào đầu danh sách
          this.teamList = [
            { ID: 0, Name: '--Tất cả các Team--' },
            ...teams.map((team: any) => ({
              ID: team.ID || 0,
              Name: team.Name || ''
            }))
          ];
        } else {
          this.teamList = [
            { ID: 0, Name: '--Tất cả các Team--' }
          ];
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách team: ' + error.message);
        this.teamList = [
          { ID: 0, Name: '--Tất cả các Team--' }
        ];
      }
    });
  }

  loadEmployees() {
    const request = { status: 0, departmentid: 0, keyword: '' };
    
    this.approveTpService.getEmployee(request).subscribe({
      next: (res: any) => {
        if (res && res.data) {
          // Filter active employees
          const activeEmployees = res.data.filter((emp: any) => emp.Status === 0);
          
          // Group employees by department
          this.employeeList = this.projectService.createdDataGroup(
            activeEmployees,
            'DepartmentName'
          );
        } else {
          this.employeeList = [];
        }
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên: ' + error.message);
        this.employeeList = [];
      }
    });
  }

  resetSearch() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    this.searchForm.reset({
      startDate: DateTime.now().minus({ days: 7 }).toJSDate(),
      endDate: lastDay,
      employeeId: null,
      teamId: 0,
      status: 0, // Chưa duyệt
      deleteFlag: 0, // Chưa xóa
      type: this.isSenior ? 3 : 0,
      statusHR: -1,
      statusBGD: -1,
      keyWord: '',
      IDApprovedTP: !this.isSenior ? (this.currentUser?.EmployeeID || 0) : 0
    });
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.initializeTable();
  }

  private initializeForm(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.searchForm = this.fb.group({
      startDate: [DateTime.now().minus({ days: 7 }).toJSDate()],
      endDate: [lastDay],
      employeeId: [null],
      teamId: [0],
      status: [0], // Chưa duyệt
      deleteFlag: [0], // Chưa xóa
      type: [0],
      statusHR: [-1],
      statusBGD: [-1],
      keyWord: [''],
      IDApprovedTP: [0]
    });
  }

  loadData() {
    if (!this.tabulator) {
      return;
    }

    this.loadingData = true;

    const formValue = this.searchForm.value;
    const startDate = formValue.startDate ? new Date(formValue.startDate).toISOString() : undefined;
    const endDate = formValue.endDate ? new Date(formValue.endDate).toISOString() : undefined;

    const request: ApproveByApproveTPRequestParam = {
      FilterText: formValue.keyWord || '',
      DateStart: startDate,
      DateEnd: endDate,
      IDApprovedTP: formValue.IDApprovedTP || 0,
      Status: formValue.status ?? 0,
      DeleteFlag: formValue.deleteFlag ?? 0,
      EmployeeID: formValue.employeeId || 0,
      TType: formValue.type ?? 0,
      StatusHR: formValue.statusHR ?? -1,
      StatusBGD: formValue.statusBGD ?? -1,
      UserTeamID: formValue.teamId || 0
    };

    this.approveTpService.getApproveByApproveTP(request).subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          const data = Array.isArray(response.data) ? response.data : [];
          this.tabulator.setData(data);
        } else {
          this.tabulator.setData([]);
        }
        this.loadingData = false;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu: ' + error.message);
        this.tabulator.setData([]);
        this.loadingData = false;
      }
    });
  }

  private initializeTable(): void {
    if (!this.tbApproveTpRef?.nativeElement) {
      return;
    }

    this.tabulator = new Tabulator(this.tbApproveTpRef.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataStretch',
      height: '90vh',
      paginationMode: 'local',
      groupBy:'TypeText',
      groupHeader: function (value, count, data, group) {
        return "Hạng mục"+value + "(" + count + " )";
      },
      columns: [
        {
          title: 'Senior duyệt', field: 'IsSeniorApprovedText', hozAlign: 'left', headerHozAlign: 'center', width: 120, headerWordWrap: true, headerSort: false,
        },
        {
          title: 'TBP duyệt', field: 'StatusText', hozAlign: 'left', headerHozAlign: 'center', width: 120, headerWordWrap: true, headerSort: false, 
        },
        {
          title: 'HR Duyệt', field: 'StatusHRText', hozAlign: 'left', headerHozAlign: 'center', width: 120, headerWordWrap: true, headerSort: false, 
        },
        {
          title: 'BGĐ duyệt', field: 'StatusBGDText', hozAlign: 'left', headerHozAlign: 'center', width: 120, headerWordWrap: true, headerSort: false,
        },
        {
          title: 'Mã nhân viên', field: 'Code', hozAlign: 'left', headerHozAlign: 'center', width: 100, headerWordWrap: true, headerSort: false, 
        },
        {
          title: 'Tên nhân viên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center', width: 180, headerWordWrap: true, formatter: 'textarea', headerSort: false, bottomCalc: 'count',
        },
        {
          title: 'Ngày', field: 'NgayDangKy', hozAlign: 'center', headerHozAlign: 'center', width: 150, headerSort: false,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          }
        },
        {
          title: 'Tên TBP duyệt', field: 'NguoiDuyet', hozAlign: 'left', headerHozAlign: 'center', width: 150, headerWordWrap: true, headerSort: false,
        },
        {
          title: 'Tên BGĐ duyệt', field: 'FullNameBGD', hozAlign: 'left', headerHozAlign: 'center', width: 150, headerWordWrap: true, headerSort: false,
        },
        {
          title: 'Nội dung', field: 'NoiDung', hozAlign: 'left', headerHozAlign: 'center', width: 350, headerSort: false, formatter: 'textarea',
        },
        {
          title: 'Lí do', field: 'Reason', hozAlign: 'left', headerHozAlign: 'center', width: 300, formatter: 'textarea', headerSort: false,
        },
     
        {
          title: 'File bổ sung', field: 'FileName', hozAlign: 'center', headerHozAlign: 'center', width: 150, headerSort: false,
          formatter: (cell) => {
            const fileName = cell.getValue();
            if (fileName) {
              return `<a href="javascript:void(0)" style="color: #1677ff; text-decoration: underline;">${fileName}</a>`;
            }
            return '';
          },
          cellClick: (e: any, cell: any) => {
            if (cell.getValue()) {
              this.downloadFile(cell.getRow().getData());
            }
          }
        },
        {
          title: 'Đánh giá công việc', field: 'EvaluateResults', hozAlign: 'left', headerHozAlign: 'center', width: 300, formatter: 'textarea', headerSort: false,
        },
        {
          title: 'Lý do HR sửa', field: 'ReasonHREdit', hozAlign: 'left', headerHozAlign: 'center', width: 300, formatter: 'textarea', headerSort: false,
        },
        {
          title: 'Lý do không duyệt', field: 'ReasonDeciline', hozAlign: 'left', headerHozAlign: 'center', width: 300, formatter: 'textarea', headerSort: false,
        },
        {
          title: 'Ngày đăng ký', field: 'CreatedDate', hozAlign: 'center', headerHozAlign: 'center', width: 150, headerSort: false,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy HH:mm') : '';
          }
        },
      ],
    });

    // Load data after table initialization
    this.loadData();
  }

  getSelectedRows(): any[] {
    const selectedRows = this.tabulator.getSelectedRows();
    return selectedRows.map(row => row.getData());
  }

  approvedTBP() {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên!');
      return;
    }

    this.approveAction(true, 'TBP');
  }

  cancelApprovedTBP() {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên!');
      return;
    }

    this.approveAction(false, 'TBP');
  }

  approvedBGD() {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên!');
      return;
    }

    this.approveAction(true, 'BGD');
  }

  cancelApprovedBGD() {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên!');
      return;
    }

    this.approveAction(false, 'BGD');
  }

  approvedSenior() {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên!');
      return;
    }

    this.approveAction(true, 'Senior');
  }

  cancelApprovedSenior() {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên!');
      return;
    }

    this.approveAction(false, 'Senior');
  }

  private approveAction(isApproved: boolean, type: 'TBP' | 'BGD' | 'Senior') {
    const selectedRows = this.getSelectedRows();
    const actionText = isApproved ? 'duyệt' : 'hủy duyệt';
    
    this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: `Bạn có chắc muốn ${actionText} ${selectedRows.length} đăng ký đã chọn không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const items: ApproveItemParam[] = selectedRows.map(row => ({
          Id: row.ID ? Number(row.ID) : null,
          TableName: row.TableName ? String(row.TableName) : '',
          FieldName: row.ColumnNameUpdate ? String(row.ColumnNameUpdate) : '',
          FullName: row.FullName ? String(row.FullName) : '',
          DeleteFlag: row.DeleteFlag !== undefined ? Boolean(row.DeleteFlag) : null,
          IsApprovedHR: row.IsApprovedHR !== undefined ? Boolean(row.IsApprovedHR) : null,
          IsCancelRegister: row.IsCancelRegister !== undefined ? Number(row.IsCancelRegister) : null,
          IsApprovedTP: row.IsApprovedTP !== undefined ? Boolean(row.IsApprovedTP) : null,
          IsApprovedBGD: row.IsApprovedBGD !== undefined ? Boolean(row.IsApprovedBGD) : null,
          IsSeniorApproved: row.IsSeniorApproved !== undefined ? Boolean(row.IsSeniorApproved) : null,
          ValueUpdatedDate: new Date().toISOString(),
          ValueDecilineApprove: row.DecilineApprove ? String(row.DecilineApprove) : '',
          EvaluateResults: row.EvaluateResults ? String(row.EvaluateResults) : '',
          EmployeeID: row.EmployeeID ? Number(row.EmployeeID) : null,
          TType: row.TType !== undefined ? Number(row.TType) : null
        }));

        const request: ApproveRequestParam = {
          Items: items,
          IsApproved: isApproved
        };

        let apiCall;
        if (type === 'TBP') {
          apiCall = this.approveTpService.approveTBP(request);
        } else if (type === 'BGD') {
          apiCall = this.approveTpService.approveBGD(request);
        } else {
          apiCall = this.approveTpService.approveSenior(request);
        }

        apiCall.subscribe({
          next: (response: any) => {
            if (response && response.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, `Đã ${actionText} thành công!`);
              this.loadData();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, response?.message || `Lỗi khi ${actionText}!`);
            }
          },
          error: (error) => {
            this.notification.error(NOTIFICATION_TITLE.error, `Lỗi khi ${actionText}: ${error.message}`);
          }
        });
      }
    });
  }

  declineApprove() {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên!');
      return;
    }

    // TODO: Implement decline approve modal with reason input
    this.notification.warning(NOTIFICATION_TITLE.warning, 'Chức năng không duyệt đang được phát triển');
  }

  downloadFile(rowData: any) {
    try {
      const tableName = rowData.TableName || '';
      const filePath = rowData.FilePath || '';
      const fileName = rowData.FileName || '';

      if (!fileName) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có file để tải!');
        return;
      }

      let folderName = '';
      if (tableName === 'EmployeeBussiness') {
        folderName = 'CongTac';
      } else if (tableName === 'EmployeeOvertime') {
        folderName = 'LamThem';
      } else {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Loại file không được hỗ trợ!');
        return;
      }

      // Construct download URL
      const downloadUrl = `${environment.host}api/home/download-by-key?key=${folderName}&subPath=${encodeURIComponent(filePath)}&fileName=${encodeURIComponent(fileName)}`;
      
      // Open download link
      window.open(downloadUrl, '_blank');
    } catch (error: any) {
      this.notification.error(NOTIFICATION_TITLE.error, `Lỗi khi tải file: ${error.message}`);
    }
  }

  async exportToExcel() {
    if (!this.tabulator) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Bảng chưa được khởi tạo!');
      return;
    }

    this.exportingExcel = true;

    try {
      const formValue = this.searchForm.value;
      const requestStartDate = formValue.startDate ? new Date(formValue.startDate).toISOString() : undefined;
      const requestEndDate = formValue.endDate ? new Date(formValue.endDate).toISOString() : undefined;

      const request: ApproveByApproveTPRequestParam = {
        FilterText: formValue.keyWord || '',
        DateStart: requestStartDate,
        DateEnd: requestEndDate,
        IDApprovedTP: formValue.IDApprovedTP || 0,
        Status: formValue.status ?? 0,
        DeleteFlag: formValue.deleteFlag ?? 0,
        EmployeeID: formValue.employeeId || 0,
        TType: formValue.type ?? 0,
        StatusHR: formValue.statusHR ?? -1,
        StatusBGD: formValue.statusBGD ?? -1,
        UserTeamID: formValue.teamId || 0
      };

      const response = await this.approveTpService.getApproveByApproveTP(request).toPromise();
      
      if (!response || response.status !== 1 || !response.data) {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không có dữ liệu để xuất excel!');
        this.exportingExcel = false;
        return;
      }

      const allData = Array.isArray(response.data) ? response.data : [];
      
      if (allData.length === 0) {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không có dữ liệu để xuất excel!');
        this.exportingExcel = false;
        return;
      }

      const exportData = allData.map((item: any, idx: number) => {
        const formatDateTime = (val: any) => {
          if (!val) return '';
          try {
            return DateTime.fromISO(val).toFormat('dd/MM/yyyy');
          } catch {
            const date = new Date(val);
            return isNaN(date.getTime()) ? '' : DateTime.fromJSDate(date).toFormat('dd/MM/yyyy');
          }
        };

        const formatDateTimeFull = (val: any) => {
          if (!val) return '';
          try {
            return DateTime.fromISO(val).toFormat('dd/MM/yyyy HH:mm');
          } catch {
            const date = new Date(val);
            return isNaN(date.getTime()) ? '' : DateTime.fromJSDate(date).toFormat('dd/MM/yyyy HH:mm');
          }
        };

        return {
          'STT': idx + 1,
          'Senior duyệt': item.IsSeniorApprovedText || '',
          'TBP duyệt': item.StatusText || '',
          'HR Duyệt': item.StatusHRText || '',
          'BGĐ duyệt': item.StatusBGDText || '',
          'Mã nhân viên': item.Code || '',
          'Tên nhân viên': item.FullName || '',
          'Ngày': formatDateTime(item.NgayDangKy),
          'Tên TBP duyệt': item.NguoiDuyet || '',
          'Tên BGĐ duyệt': item.FullNameBGD || '',
          'Nội dung': item.NoiDung || '',
          'Lí do': item.Reason || '',
          'Hạng mục': item.TypeText || '',
          'File bổ sung': item.FileName || '',
          'Đánh giá công việc': item.EvaluateResults || '',
          'Lý do HR sửa': item.ReasonHREdit || '',
          'Lý do không duyệt': item.ReasonDeciline || '',
          'Ngày đăng ký': formatDateTimeFull(item.CreatedDate)
        };
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('DuyetTP');

      worksheet.columns = [
        { header: 'STT', key: 'STT', width: 5 },
        { header: 'Senior duyệt', key: 'Senior duyệt', width: 20 },
        { header: 'TBP duyệt', key: 'TBP duyệt', width: 20 },
        { header: 'HR Duyệt', key: 'HR Duyệt', width: 20 },
        { header: 'BGĐ duyệt', key: 'BGĐ duyệt', width: 20 },
        { header: 'Mã nhân viên', key: 'Mã nhân viên', width: 15 },
        { header: 'Tên nhân viên', key: 'Tên nhân viên', width: 25 },
        { header: 'Ngày', key: 'Ngày', width: 15 },
        { header: 'Tên TBP duyệt', key: 'Tên TBP duyệt', width: 20 },
        { header: 'Tên BGĐ duyệt', key: 'Tên BGĐ duyệt', width: 20 },
        { header: 'Nội dung', key: 'Nội dung', width: 40 },
        { header: 'Lí do', key: 'Lí do', width: 40 },
        { header: 'Hạng mục', key: 'Hạng mục', width: 20 },
        { header: 'File bổ sung', key: 'File bổ sung', width: 30 },
        { header: 'Đánh giá công việc', key: 'Đánh giá công việc', width: 40 },
        { header: 'Lý do HR sửa', key: 'Lý do HR sửa', width: 40 },
        { header: 'Lý do không duyệt', key: 'Lý do không duyệt', width: 40 },
        { header: 'Ngày đăng ký', key: 'Ngày đăng ký', width: 20 },
      ];

      exportData.forEach((row: any) => worksheet.addRow(row));

      worksheet.getRow(1).eachCell((cell: ExcelJS.Cell) => {
        cell.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1677FF' }
        };
      });
      worksheet.getRow(1).height = 30;

      worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
        if (rowNumber !== 1) {
          row.height = 30;
          row.eachCell({ includeEmpty: false }, (cell: ExcelJS.Cell) => {
            cell.font = { name: 'Times New Roman', size: 10 };
            cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
          });
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const exportStartDate = this.searchForm.get('startDate')?.value;
      const exportEndDate = this.searchForm.get('endDate')?.value;
      const startDateStr = exportStartDate ? DateTime.fromJSDate(new Date(exportStartDate)).toFormat('ddMMyyyy') : '';
      const endDateStr = exportEndDate ? DateTime.fromJSDate(new Date(exportEndDate)).toFormat('ddMMyyyy') : '';
      saveAs(blob, `DuyetTP_${startDateStr}_${endDateStr}.xlsx`);
      
    } catch (error: any) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xuất Excel: ' + error.message);
    } finally {
      this.exportingExcel = false;
    }
  }
}
