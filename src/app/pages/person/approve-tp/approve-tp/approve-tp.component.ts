import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Optional, Inject } from '@angular/core';
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
import { ApproveTpService, ApproveByApproveTPRequestParam, ApproveRequestParam, ApproveItemParam } from '../approve-tp-service/approve-tp.service';
import { AuthService } from '../../../../auth/auth.service';
import { ProjectService } from '../../../project/project-service/project.service';

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
  loadingData = false;
  sizeSearch: string = '0';
  currentUser: any = null;
  isSenior: boolean = false;
  isBGD: boolean = false;
  isSeniorMode: boolean = false; // true: Senior duyệt làm thêm, false: Duyệt công

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private approveTpService: ApproveTpService,
    private authService: AuthService,
    private projectService: ProjectService,
    private modal: NzModalService,
    @Optional() @Inject('tabData') private tabData: any
  ) {
    if (this.tabData) {
      this.isSeniorMode = this.tabData.isSeniorMode || false;
    }
  }

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
        this.isSenior = false;
        const idApprovedTP = this.isSeniorMode ? 0 : (!this.isSenior ? (data?.EmployeeID || 0) : 0);
        if (this.searchForm) {
          this.searchForm.patchValue({
            IDApprovedTP: idApprovedTP
          });
        }
        if (this.tabulator) {
          this.loadData();
        }
      }
    });
  }

  loadTeams() {
    this.approveTpService.getUserTeam().subscribe({
      next: (response: any) => {
       this.teamList= response.data;
      },
      error: (error:any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách team: ' + error.error.message);
      
      }
    });
  }

  loadEmployees() {
    const request = { status: 0, departmentid: 0, keyword: '' };

    this.approveTpService.getEmployee(request).subscribe({
      next: (res: any) => {
        if (res && res.data) {
          const activeEmployees = res.data.filter((emp: any) => emp.Status === 0);
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

    const defaultType = this.isSeniorMode ? 3 : 0;
    const idApprovedTP = this.isSeniorMode ? 0 : (!this.isSenior ? (this.currentUser?.EmployeeID || 0) : 0);

    this.searchForm.reset({
      startDate: DateTime.now().minus({ days: 7 }).toJSDate(),
      endDate: lastDay,
      employeeId: null,
      teamId: 0,
      status: 0,
      deleteFlag: 0,
      type: defaultType,
      statusHR: -1,
      statusBGD: -1,
      keyWord: '',
      IDApprovedTP: idApprovedTP
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

    const defaultType = this.isSeniorMode ? 3 : 0;

    this.searchForm = this.fb.group({
      startDate: [DateTime.now().minus({ days: 7 }).toJSDate()],
      endDate: [lastDay],
      employeeId: [null],
      teamId: [0],
      status: [0],
      deleteFlag: [0],
      type: [defaultType],
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

    const ttype = this.isSeniorMode ? 3 : (formValue.type ?? 0);

    const request: ApproveByApproveTPRequestParam = {
      FilterText: formValue.keyWord || '',
      DateStart: startDate,
      DateEnd: endDate,
      IDApprovedTP: formValue.IDApprovedTP || 0,
      Status: formValue.status ?? 0,
      DeleteFlag: formValue.deleteFlag ?? 0,
      EmployeeID: formValue.employeeId || 0,
      TType: ttype,
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
      groupBy: 'TypeText',
      groupHeader: function (value, count, data, group) {
        return "Hạng mục : " + value + "(" + count + " )";
      },
      columns: [
        {
          title: 'Senior duyệt', field: 'IsSeniorApprovedText', hozAlign: 'center', headerHozAlign: 'center', width: 120, headerWordWrap: true, headerSort: false,
        },
        {
          title: 'TBP duyệt', field: 'StatusText', hozAlign: 'center', headerHozAlign: 'center', width: 120, headerWordWrap: true, headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            let numValue = 0;
            if (value === null || value === undefined) {
              numValue = 0;
            } else if (typeof value === 'number') {
              numValue = value;
            } else if (typeof value === 'string') {
              if (value === 'Đã duyệt') numValue = 1;
              else if (value === 'Từ chối' || value === 'Không duyệt') numValue = 2;
              else numValue = 0;
            }
            return this.formatApprovalBadge(numValue);
          },

        },
        {
          title: 'HR Duyệt', field: 'StatusHRText', hozAlign: 'center', headerHozAlign: 'center', width: 120, headerWordWrap: true, headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            let numValue = 0;
            if (value === null || value === undefined) {
              numValue = 0;
            } else if (typeof value === 'number') {
              numValue = value;
            } else if (typeof value === 'string') {
              if (value === 'Đã duyệt') numValue = 1;
              else if (value === 'Từ chối' || value === 'Không duyệt') numValue = 2;
              else numValue = 0;
            }
            return this.formatApprovalBadge(numValue);
          },

        },
        {
          title: 'BGĐ duyệt', field: 'StatusBGDText', hozAlign: 'center', headerHozAlign: 'center', width: 120, headerWordWrap: true, headerSort: false,
          formatter: (cell: any) => {
            const value = cell.getValue();
            let numValue = 0;
            if (value === null || value === undefined) {
              numValue = 0;
            } else if (typeof value === 'number') {
              numValue = value;
            } else if (typeof value === 'string') {
              if (value === 'Đã duyệt') numValue = 1;
              else if (value === 'Từ chối' || value === 'Không duyệt') numValue = 2;
              else numValue = 0;
            }
            return this.formatApprovalBadge(numValue);
          },

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

    this.approveTBPWithValidation(true);
  }

  cancelApprovedTBP() {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên!');
      return;
    }

    this.approveTBPWithValidation(false);
  }

  private approveTBPWithValidation(isApproved: boolean) {
    const selectedRows = this.getSelectedRows();
    const actionText = isApproved ? 'duyệt' : 'hủy duyệt';
    const isAdmin = this.currentUser?.IsAdmin || false;

    if (!isAdmin) {
      for (const row of selectedRows) {
        const id = row.ID ? Number(row.ID) : 0;
        if (id <= 0) {
          continue;
        }

        const fullname = row.FullName ? String(row.FullName) : '';
        const table = row.TypeText ? String(row.TypeText) : '';
        const deleteFlag = row.DeleteFlag !== undefined ? Boolean(row.DeleteFlag) : false;
        const isApprovedHR = row.IsApprovedHR !== undefined ? Boolean(row.IsApprovedHR) : false;
        const isCancelRegister = row.IsCancelRegister !== undefined ? Number(row.IsCancelRegister) : 0;
        const isApprovedTP = row.IsApprovedTP !== undefined ? Boolean(row.IsApprovedTP) : false;
        const isApprovedBGD = row.IsApprovedBGD === true || row.IsApprovedBGD === 1 || row.IsApprovedBGD === '1';

        if (deleteFlag) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            `Bạn không thể ${actionText} vì nhân viên ${fullname} đã tự xoá khai báo [${table}]!`
          );
          return;
        }

        if (!isApproved && isApprovedHR) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            `Bạn không thể ${actionText} vì nhân viên ${fullname} đã được HR duyệt!`
          );
          return;
        }

        if (isCancelRegister > 0) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            `Bạn không thể ${actionText} vì nhân viên ${fullname} đã đăng ký hủy!`
          );
          return;
        }

        if (isApproved && isApprovedTP) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            `Bạn không thể ${actionText} vì nhân viên ${fullname} đã được TBP duyệt!`
          );
          return;
        }

        if (!isApproved && !isApprovedTP) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            `Bạn không thể ${actionText} vì nhân viên ${fullname} chưa được TBP duyệt!`
          );
          return;
        }

        if (!isApproved && isApprovedBGD) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            `Bạn không thể ${actionText} vì nhân viên ${fullname} đã được BGĐ duyệt!`
          );
          return;
        }
      }
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: `Bạn có chắc muốn ${actionText} danh sách nhân viên đã chọn không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const items: ApproveItemParam[] = selectedRows
          .filter(row => {
            const id = row.ID ? Number(row.ID) : 0;
            return id > 0;
          })
          .map(row => {
            const ttype = row.TType !== undefined ? Number(row.TType) : 0;
            const evaluateResults = row.EvaluateResults ? String(row.EvaluateResults) : '';

            return {
              Id: row.ID ? Number(row.ID) : null,
              TableName: row.TableName ? String(row.TableName) : '',
              FieldName: row.ColumnNameUpdate ? String(row.ColumnNameUpdate) : '',
              FullName: row.FullName ? String(row.FullName) : '',
              DeleteFlag: row.DeleteFlag !== undefined ? Boolean(row.DeleteFlag) : null,
              IsApprovedHR: row.IsApprovedHR !== undefined ? Boolean(row.IsApprovedHR) : null,
              IsCancelRegister: row.IsCancelRegister !== undefined ? Number(row.IsCancelRegister) : null,
              IsApprovedTP: isApproved,
              IsApprovedBGD: row.IsApprovedBGD !== undefined ? Boolean(row.IsApprovedBGD) : null,
              IsSeniorApproved: row.IsSeniorApproved !== undefined ? Boolean(row.IsSeniorApproved) : null,
              ValueUpdatedDate: new Date().toISOString(),
              ValueDecilineApprove: isApproved ? '1' : (row.DecilineApprove !== undefined ? String(row.DecilineApprove) : ''),
              EvaluateResults: evaluateResults,
              EmployeeID: row.EmployeeID ? Number(row.EmployeeID) : null,
              TType: row.TType !== undefined ? Number(row.TType) : null
            };
          });

        const request: ApproveRequestParam = {
          Items: items,
          IsApproved: isApproved
        };

        this.approveTpService.approveTBP(request).subscribe({
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

    this.approveSeniorWithValidation(true);
  }

  cancelApprovedSenior() {
    const selectedRows = this.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên!');
      return;
    }

    this.approveSeniorWithValidation(false);
  }

  private approveSeniorWithValidation(isApproved: boolean) {
    const selectedRows = this.getSelectedRows();
    const actionText = isApproved ? 'duyệt' : 'hủy duyệt';

    this.approveTpService.getUserTeamLinkByLeaderID().subscribe({
      next: (response: any) => {
        let seniorList: any[] = [];
        if (response && response.status === 1 && response.data) {
          seniorList = Array.isArray(response.data) ? response.data : [response.data];
        }

        for (const row of selectedRows) {
          const tableName = row.TableName ? String(row.TableName) : '';
          const employeeID = row.EmployeeID ? Number(row.EmployeeID) : 0;
          const fullName = row.FullName ? String(row.FullName) : '';

          if (tableName !== 'EmployeeOvertime') {
            continue;
          }

          const isSenior = seniorList.some((senior: any) => 
            senior.EmployeeID === employeeID
          );

          if (!isSenior) {
            this.notification.warning(
              NOTIFICATION_TITLE.warning,
              `Bạn không phải là Senior của nhân viên [${fullName}]`
            );
            return;
          }

          if (!isApproved) {
            const isSeniorApproved = row.IsSeniorApproved !== undefined ? Boolean(row.IsSeniorApproved) : false;
            if (!isSeniorApproved) {
              this.notification.warning(
                NOTIFICATION_TITLE.warning,
                `Nhân viên [${fullName}] chưa được Senior duyệt, không thể hủy duyệt.`
              );
              return;
            }
          }

          const isApprovedBGD = row.IsApprovedBGD !== undefined ? Boolean(row.IsApprovedBGD) : false;
          
          if (isApprovedBGD) {
            this.notification.warning(
              NOTIFICATION_TITLE.warning,
              `Nhân viên [${fullName}] đã được BGĐ duyệt, Senior không thể thay đổi.`
            );
            return;
          }
        }

    this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: `Bạn có chắc muốn ${actionText} ${selectedRows.length} đăng ký đã chọn không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
            const items: ApproveItemParam[] = selectedRows
              .filter(row => {
                const tableName = row.TableName ? String(row.TableName) : '';
                if (tableName !== 'EmployeeOvertime') {
                  return false;
                }
                
                const employeeID = row.EmployeeID ? Number(row.EmployeeID) : 0;
                const isSenior = seniorList.some((senior: any) => 
                  senior.EmployeeID === employeeID
                );
                if (!isSenior) {
                  return false;
                }
                
                const isApprovedBGD = row.IsApprovedBGD !== undefined ? Boolean(row.IsApprovedBGD) : false;
                if (isApprovedBGD) {
                  return false;
                }

                if (!isApproved) {
                  const isSeniorApproved = row.IsSeniorApproved !== undefined ? Boolean(row.IsSeniorApproved) : false;
                  if (!isSeniorApproved) {
                    return false;
                  }
                }

                return true;
              })
              .map(row => {
                const employeeID = row.EmployeeID ? Number(row.EmployeeID) : 0;
                return {
          Id: row.ID ? Number(row.ID) : null,
          TableName: row.TableName ? String(row.TableName) : '',
                  FieldName: 'IsSeniorApproved',
                  FullName: row.FullName ? String(row.FullName) : '',
                  DeleteFlag: row.DeleteFlag !== undefined ? Boolean(row.DeleteFlag) : null,
                  IsApprovedHR: row.IsApprovedHR !== undefined ? Boolean(row.IsApprovedHR) : null,
                  IsCancelRegister: row.IsCancelRegister !== undefined ? Number(row.IsCancelRegister) : null,
                  IsApprovedTP: row.IsApprovedTP !== undefined ? Boolean(row.IsApprovedTP) : null,
                  IsApprovedBGD: row.IsApprovedBGD !== undefined ? Boolean(row.IsApprovedBGD) : null,
                  IsSeniorApproved: isApproved,
                  ValueUpdatedDate: new Date().toISOString(),
                  ValueDecilineApprove: row.DecilineApprove ? String(row.DecilineApprove) : '',
                  EvaluateResults: row.EvaluateResults ? String(row.EvaluateResults) : '',
                  EmployeeID: employeeID,
                  TType: row.TType !== undefined ? Number(row.TType) : null
                };
              });

            if (items.length === 0) {
              this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Không có bản ghi nào phù hợp để xử lý! Vui lòng kiểm tra:\n- Chỉ xử lý đăng ký làm thêm (EmployeeOvertime)\n- Chưa được TBP hoặc BGĐ duyệt\n- Bạn phải là Senior của nhân viên đó\n- Khi hủy duyệt: phải đã được Senior duyệt trước đó'
              );
              return;
            }

            const request: ApproveRequestParam = {
              Items: items,
              IsApproved: isApproved
            };

            this.approveTpService.approveSenior(request).subscribe({
              next: (response: any) => {
                if (response && response.status === 1) {
                  const notProcessed = response.data || [];
                  if (notProcessed.length > 0) {
                    const reasons = notProcessed.map((item: any) => 
                      `${item.Item?.FullName || 'N/A'}: ${item.Reason || 'Không xác định'}`
                    ).join('\n');
                    
                    this.notification.warning(
                      NOTIFICATION_TITLE.warning,
                      `Đã ${actionText} thành công, nhưng có ${notProcessed.length} bản ghi không được xử lý:\n${reasons}`
                    );
                  } else {
                    this.notification.success(NOTIFICATION_TITLE.success, `Đã ${actionText} thành công!`);
                  }
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
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, `Lỗi khi lấy danh sách Senior: ${error.message}`);
      }
    });
  }

  private approveAction(isApproved: boolean, type: 'TBP' | 'BGD' | 'Senior') {
    const selectedRows = this.getSelectedRows();
    const actionText = isApproved ? 'duyệt' : 'hủy duyệt';

    if (type === 'BGD') {
      for (const row of selectedRows) {
        const id = row.ID ? Number(row.ID) : 0;
        if (id <= 0) {
          continue;
        }

        const fullName = row.FullName ? String(row.FullName) : '';
        const isApprovedHR = row.IsApprovedHR !== undefined ? Boolean(row.IsApprovedHR) : false;
        const isApprovedBGD = row.IsApprovedBGD !== undefined ? Boolean(row.IsApprovedBGD) : false;

        if (!isApprovedHR) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            `Nhân viên [${fullName}] chưa được HR duyệt, BGD không thể duyệt / hủy duyệt.`
          );
          return;
        }

        if (!isApproved && !isApprovedBGD) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            `Nhân viên [${fullName}] chưa được BGĐ duyệt, không thể hủy duyệt.`
          );
          return;
        }
      }
    }

    const confirmMessage = type === 'BGD' 
      ? `Bạn có chắc muốn ${actionText} ${selectedRows.length} đăng ký đã chọn không?\n(Những đăng ký chưa được HR duyệt sẽ tự động được bỏ qua!)`
      : `Bạn có chắc muốn ${actionText} ${selectedRows.length} đăng ký đã chọn không?`;

    this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: confirmMessage,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const items: ApproveItemParam[] = selectedRows
          .filter(row => {
            if (type === 'BGD') {
              const isApprovedHR = row.IsApprovedHR !== undefined ? Boolean(row.IsApprovedHR) : false;
              const isApprovedBGD = row.IsApprovedBGD !== undefined ? Boolean(row.IsApprovedBGD) : false;
              
              if (!isApprovedHR) {
                return false;
              }
              
              if (!isApproved && !isApprovedBGD) {
                return false;
              }
            }
            return true;
          })
          .map(row => ({
          Id: row.ID ? Number(row.ID) : null,
          TableName: row.TableName ? String(row.TableName) : '',
          FieldName: type === 'BGD' ? 'IsApprovedBGD' : (row.ColumnNameUpdate ? String(row.ColumnNameUpdate) : ''),
          FullName: row.FullName ? String(row.FullName) : '',
          DeleteFlag: row.DeleteFlag !== undefined ? Boolean(row.DeleteFlag) : null,
          IsApprovedHR: row.IsApprovedHR !== undefined ? Boolean(row.IsApprovedHR) : null,
          IsCancelRegister: row.IsCancelRegister !== undefined ? Number(row.IsCancelRegister) : null,
          IsApprovedTP: type === 'TBP' ? isApproved : (row.IsApprovedTP !== undefined ? Boolean(row.IsApprovedTP) : null),
          IsApprovedBGD: type === 'BGD' ? isApproved : (row.IsApprovedBGD !== undefined ? Boolean(row.IsApprovedBGD) : null),
          IsSeniorApproved: type === 'Senior' ? isApproved : (row.IsSeniorApproved !== undefined ? Boolean(row.IsSeniorApproved) : null),
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

    this.notification.warning(NOTIFICATION_TITLE.warning, 'Chức năng không duyệt đang được phát triển');
  }

  approvedCancelRegister() {
    const selectedRows = this.getSelectedRows();
    
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn nhân viên!');
      return;
    }

    for (const row of selectedRows) {
      const id = row.ID ? Number(row.ID) : 0;
      if (id <= 0) {
        continue;
      }

      const deleteFlag = row.DeleteFlag !== undefined ? Boolean(row.DeleteFlag) : false;
      if (deleteFlag) {
        const fullname = row.FullName ? String(row.FullName) : '';
        const table = row.TypeText ? String(row.TypeText) : '';
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          `Bạn không thể Duyệt huỷ đăng ký vì nhân viên ${fullname} đã tự xoá khai báo [${table}]!`
        );
        return;
      }

      const isCancelRegister = row.IsCancelRegister !== undefined ? Number(row.IsCancelRegister) : -1;
      if (isCancelRegister < 0) {
        const fullname = row.FullName ? String(row.FullName) : '';
        this.notification.warning(
          NOTIFICATION_TITLE.warning,
          `Bạn không thể duyệt đăng ký hủy vì nhân viên ${fullname} chưa đăng ký hủy!`
        );
        return;
      }
    }

    let confirmContent = '';
    if (selectedRows.length === 1) {
      const name = selectedRows[0].FullName ? String(selectedRows[0].FullName) : '';
      confirmContent = `Bạn có chắc muốn không duyệt cho nhân viên [${name}] hay không!`;
    } else {
      confirmContent = `Bạn có chắc muốn không duyệt cho những nhân viên này hay không!`;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: confirmContent,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const items: ApproveItemParam[] = selectedRows
          .filter(row => {
            const id = row.ID ? Number(row.ID) : 0;
            return id > 0;
          })
          .map(row => ({
            Id: row.ID ? Number(row.ID) : null,
            TableName: row.TableName ? String(row.TableName) : '',
            FieldName: 'IsCancelTP',
            FullName: row.FullName ? String(row.FullName) : '',
            DeleteFlag: row.DeleteFlag !== undefined ? Boolean(row.DeleteFlag) : null,
            IsApprovedHR: row.IsApprovedHR !== undefined ? Boolean(row.IsApprovedHR) : null,
            IsCancelRegister: row.IsCancelRegister !== undefined ? Number(row.IsCancelRegister) : null,
            IsApprovedTP: true,
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
          IsApproved: true
        };

        this.approveTpService.approveTBP(request).subscribe({
          next: (response: any) => {
            if (response && response.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Đã duyệt hủy đăng ký thành công!');
              this.loadData();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Lỗi khi duyệt hủy đăng ký!');
            }
          },
          error: (error) => {
            this.notification.error(NOTIFICATION_TITLE.error, `Lỗi khi duyệt hủy đăng ký: ${error.message}`);
          }
        });
      }
    });
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

      const downloadUrl = `${environment.host}api/home/download-by-key?key=${folderName}&subPath=${encodeURIComponent(filePath)}&fileName=${encodeURIComponent(fileName)}`;
      window.open(downloadUrl, '_blank');
    } catch (error: any) {
      this.notification.error(NOTIFICATION_TITLE.error, `Lỗi khi tải file: ${error.message}`);
    }
  }

  private formatApprovalBadge(status: number): string {
    const numStatus = status === null || status === undefined ? 0 : Number(status);

    switch (numStatus) {
      case 0:
        return '<span class="badge bg-warning text-dark" style="display: inline-block; text-align: center;">Chưa duyệt</span>';
      case 1:
        return '<span class="badge bg-success" style="display: inline-block; text-align: center;">Đã duyệt</span>';
      case 2:
        return '<span class="badge bg-danger" style="display: inline-block; text-align: center;">Không duyệt</span>';
      default:
        return '<span class="badge bg-secondary" style="display: inline-block; text-align: center;">Không xác định</span>';
    }
  }
}
