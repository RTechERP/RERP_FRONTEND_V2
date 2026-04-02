import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
  IterableDiffers,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import {
  NzUploadModule,
  NzUploadFile,
  NzUploadXHRArgs,
} from 'ng-zorro-antd/upload';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { OnInit, AfterViewInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { TableModule } from 'primeng/table';

import { PlanWeekSharkTeamService } from './plan-week-shark-team-services/plan-week-shark-team.service';
import { KhoBaseService } from '../kho-base/kho-base-service/kho-base.service';
import { Title } from '@angular/platform-browser';
import { PlanWeekSharkTeamDetailComponent } from '../plan-week-shark-team-detail/plan-week-shark-team-detail/plan-week-shark-team-detail.component';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { AppUserService } from '../../../../services/app-user.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

interface TableCol {
  field: string;
  header: string;
  width: string;
  isLongText: boolean;
  frozen?: boolean;
}

@Component({
  selector: 'app-plan-week-shark-team',
  imports: [
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
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
    NzInputNumberModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzModalModule,
    NzUploadModule,
    NzSwitchModule,
    NzCheckboxModule,
    CommonModule,
    NzTreeSelectModule,
    HasPermissionDirective,
    NzSpinModule,
    TableModule,
  ],
  templateUrl: './plan-week-shark-team.component.html',
  styleUrl: './plan-week-shark-team.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PlanWeekSharkTeamComponent implements OnInit, AfterViewInit {
  tableColumns: TableCol[] = [];
  headerGroups: { header: string; colspan: number; frozen?: boolean }[][] = [];
  dataset: any[] = [];
  isLoadingData: boolean = false;

  sizeSearch: string = '0';
  isMobile: boolean = false;
  toggleSearchPanel() {
    if (this.isMobile) {
      this.sizeSearch = this.sizeSearch === '0' ? '100%' : '0';
    } else {
      this.sizeSearch = this.sizeSearch === '0' ? '22%' : '0';
    }
  }

  filters: any = {
    departmentId: 0,
    teamId: 0,
    userId: 0,
    startDate: new Date(),
    endDate: new Date(),
  };

  selectedRow: any = null;
  selectedId: number = 0;
  selectedField: string | null = null;
  selectedCellField: string | null = null;
  selectedCellRow: any = null;
  isEditMode: boolean = false;
  isCurrentUserAdmin: boolean = false;
  isUserFilterDisabled: boolean = false;
  isTeamFilterDisabled: boolean = false;
  filterDepartmentData: any[] = [];
  filterTeamData: any[] = [];
  filterUserData: any[] = [];
  mainData: any[] = [];

  constructor(
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private planWeekService: PlanWeekSharkTeamService,
    private appUserService: AppUserService,
    private khoBaseService: KhoBaseService
  ) { }

  ngOnInit(): void {
    this.isMobile = window.innerWidth < 576;
    const today = new Date();

    const day = today.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    monday.setHours(0, 0, 0);
    sunday.setHours(23, 59, 59);

    this.filters.startDate = monday;
    this.filters.endDate = sunday;

    this.configureUserFilterByRole();

    this.loadDepartment();
    this.loadRootTeams();
    this.loadUser();
  }

  ngAfterViewInit(): void {
    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 576;
    if (this.isMobile && !wasMobile && this.sizeSearch !== '0') {
      this.sizeSearch = '100%';
    }
    if (!this.isMobile && wasMobile && this.sizeSearch === '100%') {
      this.sizeSearch = '22%';
    }
  };

  searchData(): void {
    this.loadMainData(
      this.filters.startDate,
      this.filters.endDate,
      this.filters.departmentId,
      this.filters.userId,
      this.filters.teamId
    );
  }

  increaseWeek(): void {
    if (this.filters.startDate && this.filters.endDate) {
      this.filters.startDate = new Date(
        this.filters.startDate.getTime() + 7 * 24 * 60 * 60 * 1000
      );
      this.filters.endDate = new Date(
        this.filters.endDate.getTime() + 7 * 24 * 60 * 60 * 1000
      );
    }
    this.loadMainData(
      this.filters.startDate,
      this.filters.endDate,
      this.filters.departmentId,
      this.filters.userId,
      this.filters.teamId
    );
  }

  decreaseWeek(): void {
    if (this.filters.startDate && this.filters.endDate) {
      this.filters.startDate = new Date(
        this.filters.startDate.getTime() - 7 * 24 * 60 * 60 * 1000
      );
      this.filters.endDate = new Date(
        this.filters.endDate.getTime() - 7 * 24 * 60 * 60 * 1000
      );
    }
    this.loadMainData(
      this.filters.startDate,
      this.filters.endDate,
      this.filters.departmentId,
      this.filters.userId,
      this.filters.teamId
    );
  }

  openPlanWeekDetailModal() {
    let userid = 0;
    if (this.isEditMode === true) {
      userid = this.selectedId;
    } else {
      userid = this.appUserService.id || 0;
    }
    const modalRef = this.modalService.open(PlanWeekSharkTeamDetailComponent, {
      centered: true,
      backdrop: 'static',
      size: 'xl',
    });
    modalRef.componentInstance.isEditMode = this.isEditMode;
    modalRef.componentInstance.UserID = userid;
    modalRef.result.then(
      (result) => {
        if (result.success && result.reloadData) {
          this.selectedRow = [];
          this.selectedId = 0;
          this.loadMainData(
            this.filters.startDate,
            this.filters.endDate,
            this.filters.departmentId,
            this.filters.userId,
            this.filters.teamId
          );
        } else {
          this.isEditMode = false;
        }
      },
      (reason) => {
        this.isEditMode = false;
        console.log('Modal closed');
      }
    );
  }

  onEdit(): void {
    if (this.selectedId > 0) {
      this.isEditMode = true;
      this.openPlanWeekDetailModal();
    } else {
      this.notification.info('Thông báo', 'Không có dữ liệu bản ghi cần sửa!');
    }
  }

  onDepartmentChange(value: any): void {
    if (value === undefined || value === null) {
      this.filters.departmentId = 0;
    }
  }

  onTeamChange(value: any): void {
    if (value === undefined || value === null) {
      this.filters.teamId = 0;
    }
  }

  onUserChange(value: any): void {
    if (value === undefined || value === null) {
      this.filters.userId = 0;
    }
  }

  loadDepartment() {
    this.planWeekService.getDepartment().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.filterDepartmentData = response.data;
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message);
        }
      },
      error: (error) => {
        const errorMessage =
          error?.error?.message || error?.message || 'Không thể tải dữ liệu';
        this.notification.error('Lỗi', errorMessage);
      },
    });
  }

  toNzTree(data: any[]): any[] {
    return data.map(item => ({
      title: `${item.FullName} - ${item.GroupSalesName}  `,
      key: item.ID.toString(),
      value: item.ID,
      expanded: true,
      children: item._children ? this.toNzTree(item._children) : []
    }));
  }

  loadRootTeams(): void {
    const employeeId = this.appUserService.employeeID || 0;

    forkJoin({
      teams: this.planWeekService.getRootTeams().pipe(
        catchError(() => of({ status: 0, message: 'Lỗi khi tải dữ liệu team' }))
      ),
      myTeam: employeeId > 0 ? this.planWeekService.getMyRootTeam(employeeId).pipe(
        catchError(() => of({ status: 1, data: { TeamSaleID: 0 } }))
      ) : of({ status: 1, data: { TeamSaleID: 0 } })
    }).subscribe({
      next: (results: any) => {
        const response = results.teams;
        const myTeamResponse = results.myTeam;

        if (response.status === 1) {
          this.filterTeamData = (response.data || []).map((item: any) => ({
            title: item.TeamSaleName,
            key: item.TeamSaleID.toString(),
            value: item.TeamSaleID.toString(),
            isLeaf: true
          }));

          if (myTeamResponse && myTeamResponse.status === 1 && myTeamResponse.data?.TeamSaleID) {
            const teamId = myTeamResponse.data.TeamSaleID;
            // Kiểm tra teamId có tồn tại trong danh sách để set mặc định
            if (this.filterTeamData.some(t => t.value === teamId.toString())) {
              this.filters.teamId = teamId.toString();
            }
          }

          this.loadMainData(
            this.filters.startDate,
            this.filters.endDate,
            this.filters.departmentId,
            this.filters.userId,
            this.filters.teamId
          );
        } else {
          this.notification.error('Thông báo', response.message || 'Lỗi khi tải dữ liệu team');
          this.loadMainData(
            this.filters.startDate,
            this.filters.endDate,
            this.filters.departmentId,
            this.filters.userId,
            this.filters.teamId
          );
        }
      },
      error: (error: any) => {
        const errorMessage = error?.error?.message || error?.message || 'Không thể tải dữ liệu team';
        this.notification.error('Lỗi', errorMessage);
        this.loadMainData(
          this.filters.startDate,
          this.filters.endDate,
          this.filters.departmentId,
          this.filters.userId,
          this.filters.teamId
        );
      }
    });
  }

  getGroupSaleUser() {
    return;
  }

  loadUser() {
    this.planWeekService.getEmployees(0).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.filterUserData = response.data;
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message);
        }
      },
      error: (error) => {
        const errorMessage =
          error?.error?.message || error?.message || 'Không thể tải dữ liệu';
        this.notification.error('Lỗi', errorMessage);
      },
    });
  }

  loadMainData(
    startDate: Date,
    endDate: Date,
    departmentId: number,
    userId: number,
    groupSaleId: number
  ) {
    this.isLoadingData = true;
    this.planWeekService
      .getData(startDate, endDate, departmentId, userId, groupSaleId)
      .subscribe({
        next: (response) => {
          if (response.status === 1) {
            let data = response.data.data || [];
            if (data && data.length > 0) {
              const columns: TableCol[] = [];
              const firstRow = data[0];

              // Track column groups for headerGroups
              const groupMap: { groupName: string; colCount: number; frozen?: boolean }[] = [];
              let lastGroupName = '';

              Object.keys(firstRow).forEach(key => {
                if (key === 'ParentID' || key === 'UserID' || key === '_children' || key === 'id') return;

                let title = key;
                let width = '100px';
                let colGroupName = '';
                let isLongText = false;

                let frozen = false;

                if (key === 'FullName') {
                  title = 'Họ tên';
                  width = '140px';
                  colGroupName = 'Nhân viên';
                  frozen = true;
                } else if (key === 'Code') {
                  title = 'Mã nhân viên';
                  width = '80px';
                  colGroupName = 'Nhân viên';
                  frozen = true;
                } else if (key === 'GroupSalesName') {
                  title = 'Tên nhóm';
                  width = '150px';
                  colGroupName = 'Nhóm';
                } else if (key.includes('_')) {
                  const parts = key.split('_');
                  const datePart = parts[0];
                  const typePart = parts[1];
                  const dateObj = new Date(datePart);

                  if (!isNaN(dateObj.getTime())) {
                    colGroupName = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
                  } else {
                    colGroupName = datePart;
                  }

                  if (typePart === 'Customer') {
                    title = 'Khách hàng';
                    width = '200px';
                  } else if (typePart === 'Content') {
                    title = 'Nội dung và kết quả';
                    width = '350px';
                    isLongText = true;
                  } else if (typePart === 'Problem') {
                    title = 'Khó khăn';
                    width = '350px';
                    isLongText = true;
                  }
                }

                columns.push({ field: key, header: title, width, isLongText, frozen });

                // Build group tracking
                if (colGroupName === lastGroupName && groupMap.length > 0) {
                  groupMap[groupMap.length - 1].colCount++;
                } else {
                  groupMap.push({ groupName: colGroupName, colCount: 1, frozen });
                  lastGroupName = colGroupName;
                }
              });

              this.tableColumns = columns;

              // Build headerGroups
              this.headerGroups = [
                groupMap.map(g => ({
                  header: g.groupName,
                  colspan: g.colCount,
                  frozen: g.frozen || false,
                }))
              ];

            } else {
              this.tableColumns = [];
              this.headerGroups = [];
            }

            // Consolidate rows by user
            data = this.consolidateRowsByUser(data);

            this.dataset = data.map((item: any, index: number) => ({
              ...item,
              id: `${item.UserID || 'temp'}_${index}`
            }));
            this.mainData = data;
          } else {
            this.notification.error(NOTIFICATION_TITLE.error, response.message);
          }
          this.isLoadingData = false;
        },
        error: (error) => {
          this.isLoadingData = false;
          const errorMessage =
            error?.error?.message || error?.message || 'Không thể tải dữ liệu';
          this.notification.error('Lỗi', errorMessage);
        },
      });
  }

  onDelete() {
    if (!this.selectedId || this.selectedId <= 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn bản ghi cần xóa');
      return;
    }
    if (
      !this.selectedField ||
      ['FullName', 'Code', 'UserID', 'ParentID'].includes(this.selectedField)
    ) {
      this.notification.info('Thông báo', 'Vui lòng chọn đúng ô ngày cần xóa');
      return;
    }

    const datePart = this.selectedField.split('_')[0];
    const dateFromField = new Date(datePart);

    const UserID = this.selectedId;
    const DatePlan = dateFromField;
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa kế hoạch ngày ${dateFromField.toLocaleDateString()} của ${this.selectedRow?.FullName
        }?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        if (isNaN(dateFromField.getTime())) {
          this.notification.error(
            'Lỗi',
            'Không xác định được ngày từ cột đã chọn'
          );
          return;
        }

        this.planWeekService.delete(UserID, DatePlan).subscribe({
          next: (sv) => {
            if (sv.status === 1) {
              this.notification.success('Thông báo', 'Xóa thành công');
              this.loadMainData(
                this.filters.startDate,
                this.filters.endDate,
                this.filters.departmentId,
                this.filters.userId,
                this.filters.teamId
              );
            } else {
              this.notification.error('Lỗi', sv.message || 'Không thể lưu');
            }
          },
          error: (err) => {
            const errorMessage =
              err?.error?.message || err?.message || 'Không thể xóa dữ liệu';
            this.notification.error('Lỗi', errorMessage);
          },
        });
      },
    });
  }

  async exportMainTableToExcel() {
    if (!this.dataset || this.dataset.length === 0 || !this.tableColumns || this.tableColumns.length === 0) {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Không có dữ liệu để xuất Excel'
      );
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('KeHoachTuan');

    const columns = this.tableColumns;

    // Extract group names from headerGroups
    const groupTitles: string[] = [];
    if (this.headerGroups.length > 0) {
      this.headerGroups[0].forEach((g: any) => {
        for (let i = 0; i < (g.colspan || 1); i++) {
          groupTitles.push(g.header || '');
        }
      });
    } else {
      columns.forEach(() => groupTitles.push(''));
    }

    const colTitles = columns.map(col => col.header);

    const headerRow1 = worksheet.addRow(groupTitles);
    headerRow1.font = { bold: true };
    headerRow1.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    headerRow1.alignment = { horizontal: 'center', vertical: 'middle' };

    const headerRow2 = worksheet.addRow(colTitles);
    headerRow2.font = { bold: true };
    headerRow2.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    headerRow2.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

    let startCol = 1;
    while (startCol <= groupTitles.length) {
      let endCol = startCol;
      const currentGroup = groupTitles[startCol - 1];

      while (endCol < groupTitles.length && groupTitles[endCol] === currentGroup) {
        endCol++;
      }

      if (currentGroup) {
        if (endCol > startCol) {
          worksheet.mergeCells(1, startCol, 1, endCol);
        }
      } else {
        worksheet.mergeCells(1, startCol, 2, startCol);
      }

      startCol = endCol + 1;
    }

    this.dataset.forEach((rowData: any) => {
      const row = columns.map((col) => rowData[col.field]);
      const addedRow = worksheet.addRow(row);
      addedRow.eachCell((cell) => {
        cell.alignment = { wrapText: true, vertical: 'middle' };
      });
    });

    worksheet.columns.forEach((column: any) => {
      column.width = 30;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const formatDate = (date: Date): string => {
      const d = new Date(date);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const start = formatDate(this.filters.startDate);
    const end = formatDate(this.filters.endDate);

    link.download = `KeHoachTuan_${start} - ${end}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  onTableRowClick(rowData: any): void {
    if (rowData) {
      this.selectedRow = rowData;
      this.selectedId = rowData['UserID'];
    }
  }

  onCellClick(field: string, rowData: any): void {
    this.selectedField = field;
    this.selectedRow = rowData;
    this.selectedId = rowData['UserID'];
    this.selectedCellField = field;
    this.selectedCellRow = rowData;
  }

  isCellSelected(field: string, rowData: any): boolean {
    return this.selectedCellField === field && this.selectedCellRow === rowData;
  }

  private configureUserFilterByRole(): void {
    const currentUserId = this.appUserService.id || 0;
    const currentUser = this.appUserService.currentUser;
    const isAdmin = this.appUserService.isAdmin;
    const isAdminSale = currentUser?.IsAdminSale === 1;
    const hasN1Permission = currentUser?.Permissions ? currentUser.Permissions.split(',').includes('N1') : false;

    const specialUserIds = [1177, 1313, 23, 1380];
    const isSpecialUser = specialUserIds.includes(currentUserId);

    const shouldLockUserFilter = !isAdmin && !isAdminSale && !isSpecialUser && !hasN1Permission;
    const shouldLockTeamFilter = !isAdmin && !hasN1Permission;

    this.isTeamFilterDisabled = shouldLockTeamFilter;

    if (shouldLockUserFilter) {
      this.isUserFilterDisabled = true;
      this.filters.userId = currentUserId;
      this.selectedId = currentUserId;
    } else {
      this.isUserFilterDisabled = false;
    }
  }

  private consolidateRowsByUser(data: any[]): any[] {
    if (!data || data.length === 0) return data;

    const firstRow = data[0];
    const datePrefixes: string[] = [];
    Object.keys(firstRow).forEach(key => {
      if (key.includes('_')) {
        const datePart = key.split('_')[0];
        if (!datePrefixes.includes(datePart) && !isNaN(new Date(datePart).getTime())) {
          datePrefixes.push(datePart);
        }
      }
    });

    const userGroups = new Map<number, any[]>();
    const userOrder: number[] = [];
    data.forEach(row => {
      const uid = row.UserID;
      if (!userGroups.has(uid)) {
        userGroups.set(uid, []);
        userOrder.push(uid);
      }
      userGroups.get(uid)!.push(row);
    });

    const result: any[] = [];

    userOrder.forEach(uid => {
      const rows = userGroups.get(uid)!;
      const baseInfo = {
        UserID: rows[0].UserID,
        Code: rows[0].Code,
        FullName: rows[0].FullName,
        ParentID: rows[0].ParentID,
        GroupSalesName: rows[0].GroupSalesName,
      };

      const dateRecords: Map<string, any[]> = new Map();
      datePrefixes.forEach(dp => dateRecords.set(dp, []));

      rows.forEach(row => {
        datePrefixes.forEach(dp => {
          const customerKey = `${dp}_Customer`;
          const contentKey = `${dp}_Content`;
          const problemKey = `${dp}_Problem`;
          const hasData = (row[customerKey] && String(row[customerKey]).trim() !== '')
            || (row[contentKey] && String(row[contentKey]).trim() !== '')
            || (row[problemKey] && String(row[problemKey]).trim() !== '');
          if (hasData) {
            dateRecords.get(dp)!.push({
              [customerKey]: row[customerKey] || '',
              [contentKey]: row[contentKey] || '',
              [problemKey]: row[problemKey] || '',
            });
          }
        });
      });

      let maxRows = 1;
      dateRecords.forEach(records => {
        if (records.length > maxRows) maxRows = records.length;
      });

      for (let i = 0; i < maxRows; i++) {
        const newRow: any = { ...baseInfo };
        datePrefixes.forEach(dp => {
          const records = dateRecords.get(dp)!;
          if (i < records.length) {
            Object.assign(newRow, records[i]);
          } else {
            newRow[`${dp}_Customer`] = '';
            newRow[`${dp}_Content`] = '';
            newRow[`${dp}_Problem`] = '';
          }
        });
        result.push(newRow);
      }
    });

    return result;
  }
}
