import { Title } from '@angular/platform-browser';
import {
  Component,
  Input,
  TemplateRef,
  ViewEncapsulation,
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
import { OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { ProjectService } from '../project-service/project.service';
import { CommonModule } from '@angular/common';
import { ProjectSurveyDetailComponent } from '../project-survey-detail/project-survey-detail.component';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { AuthService } from '../../../auth/auth.service';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';

@Component({
  selector: 'app-project-survey',
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
    NzTabsModule,
    NzSpinModule,
    NzTreeSelectModule,
    NzModalModule,
    CommonModule,
    NzUploadModule,HasPermissionDirective
  ],
  //encapsulation: ViewEncapsulation.None,
  templateUrl: './project-survey.component.html',
  styleUrl: './project-survey.component.css',
})
export class ProjectSurveyComponent implements AfterViewInit {
  //#region Khai báo biến
  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private router: Router,
    private authService:AuthService
  ) {}

  @ViewChild('tb_projectSurvey', { static: false })
  tb_projectSurveyContainer!: ElementRef;
  @ViewChild('infoApproved', { static: false })
  infoApprovedContainer!: TemplateRef<any>;
  @ViewChild('resultSurvey', { static: false })
  resultSurveyContainer!: TemplateRef<any>;
  @ViewChild('tb_projectSurveyFile', { static: false })
  tb_projectSurveyFileContainer!: ElementRef;

  tb_projectSurvey: any;
  sizeSearch: string = '0';
  isLoadTable: any = false;

  employees: any[] = [];
  projects: any[] = [];

  // dateStart: any = DateTime.local().toISO();
  dateStart: any = DateTime.local()
    .set({ hour: 0, minute: 0, second: 0, year: 2023, month: 1, day: 1 })
    .toISO();
  dateEnd: any = DateTime.local().plus({ month: 2 }).toISO();
  dateSurvey: any = DateTime.fromJSDate(new Date());
  projectId: any;
  technicalId: any;
  saleId: any;
  keyword: any;

  currentUser:any;

  partOfDayId: any = 0;
  reason: any = '';

  technicalRequestId: any;
  isDisableReasion: any = false;

  //Kết quả khảo sát
  employeeIdResult: any;
  dateResult: any = DateTime.local().toISO();
  result: any;
  fileListResult: any[] = [];
  fileDeletedIds: any[] = [];
  tb_projectSurveyFile: any;
  //#endregion
  //#region Chạy khi mở chương trình
  ngAfterViewInit(): void {
    this.drawTbProjectSurvey(this.tb_projectSurveyContainer.nativeElement);
    this.getEmployees();
    this.getProjects();
    this.getDataProjectSurvey();
    this.getCurrentUser();
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  getCurrentUser(){
    this.authService.getCurrentUser().subscribe({
    next: (response: any) => {
      this.currentUser = response.data;
    },
    error: (error: any) => {
      const msg = error.message || 'Lỗi không xác định';
      this.notification.error('Thông báo', msg);
      console.error('Lỗi:', error.error);
    },
  })
  }

  async getEmployees() {
    this.projectService.getProjectEmployee(0).subscribe({
      next: (response: any) => {
        this.employees = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
        console.log(response.data);
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error('Thông báo', msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  async getProjects() {
    this.projectService.getProjectModal().subscribe({
      next: (response: any) => {
        this.projects = response.data;
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error('Thông báo', msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  reset() {
    this.dateStart = DateTime.local().toISO();
    this.dateEnd = DateTime.local().plus({ month: 2 }).toISO();
    this.projectId = 0;
    this.technicalId = 0;
    this.saleId = 0;
    this.keyword = '';
  }

  async getDataProjectSurvey() {
    this.isLoadTable = true;

    let data = {
      dateStart: this.dateStart
        ? DateTime.fromJSDate(new Date(this.dateStart)).toISO()
        : null,
      dateEnd: this.dateEnd
        ? DateTime.fromJSDate(new Date(this.dateEnd)).toISO()
        : null,
      projectId: this.projectId ? this.projectId : 0,
      technicalId: this.technicalId ? this.technicalId : 0,
      saleId: this.saleId ? this.saleId : 0,
      keyword: this.keyword ? this.keyword : '',
    };

    this.projectService.getDataProjectSurvey(data).subscribe({
      next: (response: any) => {
        this.tb_projectSurvey.setData(response.data);
        this.isLoadTable = false;
      },
      error: (error) => {
        console.error('Lỗi:', error);
        this.isLoadTable = false;
      },
    });
  }
  //#endregion

  //#region Vẽ bảng khảo sát dự án
  drawTbProjectSurvey(container: HTMLElement) {
    let contextMenu = [
      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fas fa-file-excel"></i> Xuất excel</span>',
        action: (e: any, row: any) => {
          this.exportExcel();
        },
      },
      {
        label:
          '<span style="font-size: 0.75rem;"><i class="fa-solid fa-folder-tree"></i> Cây thư mục</span>',
        action: (e: any, row: any) => {
          this.openFolder();
        },
      },
      {
        label:
          '<span style="font-size: 0.75rem; color:green;"><i class="far fa-circle-check"></i> Duyệt gấp</span>',
        action: (e: any, row: any) => {
          this.approved(true, 'duyệt gấp', 1);
        },
      },
      {
        label:
          '<span style="font-size: 0.75rem; color:red;"><i class="far fa-circle-xmark"></i> Hủy duyệt gấp</span>',
        action: (e: any, row: any) => {
          this.approved(false, 'hủy duyệt gấp', 1);
        },
      },
      {
        label:
          '<span style="font-size: 0.75rem; color:green;"><i class="far fa-square-check"></i> Duyệt yêu cầu</span>',
        action: (e: any, row: any) => {
          this.approved(true, 'duyệt', 2);
        },
      },
      {
        label:
          '<span style="font-size: 0.75rem; color:red;"><i class="far fa-rectangle-xmark"></i> Hủy duyệt yêu cầu</span>',
        action: (e: any, row: any) => {
          this.approved(false, 'hủy duyệt', 2);
        },
      },
    ];

    this.tb_projectSurvey = new Tabulator(container, {
        height: '100%',
        layout: 'fitColumns',
        locale: 'vi',
        selectableRows:1,
      pagination: false,
      groupBy: 'ProjectCode',
      groupHeader: function (value, count, data, group) {
        return `Mã dự án: ${value}`;
      },
      rowContextMenu: contextMenu,
      columns: [
        {
          title: 'THÔNG TIN YÊU CẦU KHẢO SÁT',
          headerHozAlign: 'center',
          columns: [
            // {
            //   title: 'Chọn',
            //   titleFormatter: () => `<input type="checkbox" />`,
            //   field: 'Selected',
            //   formatter: function (cell, formatterParams, onRendered) {
            //     const checked = cell.getValue() ? 'checked' : '';
            //     return `<input type='checkbox' ${checked} />`;
            //   },
            //   headerClick: (e, column) => {
            //     // Toggle trạng thái (nếu cần)
            //     const isChecked = (e.target as HTMLInputElement).checked;

            //     // Cập nhật toàn bộ giá trị cột 'Selected'
            //     column
            //       .getTable()
            //       .getRows()
            //       .forEach((row) => {
            //         row.update({ Selected: isChecked });
            //       });
            //   },
            //   cellClick: (e, cell) => {
            //     const newValue = !cell.getValue();
            //     const row = cell.getRow();

            //     if (row.getTreeChildren && row.getTreeChildren().length > 0) {
            //       const children = row.getTreeChildren();

            //       children.forEach((childRow) => {
            //         const childData = childRow.getData();
            //         childRow.update({ Selected: newValue });
            //       });
            //     }
            //     cell.setValue(newValue);
            //   },
            //   hozAlign: 'center',
            //   headerHozAlign: 'center',
            //   headerSort: false,
            //   width: '5px',
            //   frozen: true,
            // },
            {
              title: 'Khảo sát gấp',
              field: 'IsUrgent',
              width: 150,
              headerHozAlign: 'center',
              formatter: function (cell, formatterParams, onRendered) {
                const checked = cell.getValue()
                  ? `<input class="form-check-input" type='checkbox' checked disabled/>`
                  : `<input class="form-check-input" style="border: 1px solid;" type='checkbox' disabled/>`;
                return checked;
              },
              cellClick: (e, cell) => {
                return;
              },
              hozAlign: 'center',
            },
            {
              title: 'Duyệt gấp',
              field: 'IsApprovedUrgent',
              width: 150,
              headerHozAlign: 'center',
              formatter: function (cell, formatterParams, onRendered) {
                const checked = cell.getValue()
                  ? `<input class="form-check-input" type='checkbox' checked disabled/>`
                  : `<input class="form-check-input" style="border: 1px solid;" type='checkbox' disabled/>`;
                return checked;
              },
              cellClick: (e, cell) => {
                return;
              },
              hozAlign: 'center',
            },
            {
              title: 'Người yêu cầu',
              field: 'FullNameRequest',
              width: 150,
              headerHozAlign: 'center',
            },
            {
              title: 'SĐT người yêu cầu',
              field: 'SDTCaNhan',
              width: 150,
              headerHozAlign: 'center',
            },
            {
              title: 'Từ ngày',
              field: 'DateStart',
              width: 150,
              headerHozAlign: 'center',
              formatter: function (cell, formatterParams, onRendered) {
                let value = cell.getValue() || '';
                const dateTime = DateTime.fromISO(value);
                value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
                return value;
              },
              hozAlign: 'center',
            },
            {
              title: 'Đến ngày',
              field: 'DateEnd',
              width: 150,
              headerHozAlign: 'center',
              formatter: function (cell, formatterParams, onRendered) {
                let value = cell.getValue() || '';
                const dateTime = DateTime.fromISO(value);
                value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
                return value;
              },
              hozAlign: 'center',
            },
            {
              title: 'Khách hàng',
              field: 'CustomerName',
              width: 300,
              headerHozAlign: 'center',
              formatter: 'textarea',
            },
            {
              title: 'Địa chỉ',
              field: 'Address',
              width: 400,
              headerHozAlign: 'center',
              formatter: 'textarea',
            },
            {
              title: 'PIC',
              field: 'PIC',
              width: 300,
              headerHozAlign: 'center',
              formatter: 'textarea',
            },
            {
              title: 'Mô tả',
              field: 'Description',
              width: 400,
              headerHozAlign: 'center',
              formatter: 'textarea',
            },
            {
              title: 'Leader Sale',
              field: 'FullNameApproved',
              width: 150,
              headerHozAlign: 'center',
            },
            {
              title: 'Lý do gấp',
              field: 'ReasonUrgent',
              width: 150,
              headerHozAlign: 'center',
              formatter: 'textarea',
            },
          ],
        },
        {
          title: 'THÔNG TIN KỸ THUẬT KHẢO SÁT',
          headerHozAlign: 'center',
          columns: [
            {
              title: 'Kiểu khảo sát',
              field: 'ProjectTypeName',
              width: 150,
              headerHozAlign: 'center',
            },
            {
              title: 'Leader Kỹ thuật',
              field: 'FullNameLeaderTBP',
              width: 150,
              headerHozAlign: 'center',
            },
            {
              title: 'Trạng thái',
              field: 'StatusText',
              width: 150,
              headerHozAlign: 'center',
            },
            {
              title: 'Kỹ thuật phụ trách',
              field: 'FullNameTechnical',
              width: 150,
              headerHozAlign: 'center',
            },
            {
              title: 'SĐT Kỹ thuật',
              field: 'SDTCaNhanTechnical',
              width: 150,
              headerHozAlign: 'center',
            },
            {
              title: 'Ngày khảo sát',
              field: 'DateSurvey',
              width: 150,
              headerHozAlign: 'center',
              formatter: function (cell, formatterParams, onRendered) {
                let value = cell.getValue() || '';
                const dateTime = DateTime.fromISO(value);
                value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
                return value;
              },
              hozAlign: 'center',
            },
            {
              title: 'Buổi khảo sát',
              field: 'SurveySessionText',
              width: 150,
              headerHozAlign: 'center',
            },
            {
              title: 'Kết quả khảo sát',
              field: 'Result',
              width: 150,
              headerHozAlign: 'center',
              formatter: 'textarea',
            },
            {
              title: 'Lý do hủy',
              field: 'ReasonCancel',
              width: 150,
              headerHozAlign: 'center',
              formatter: 'textarea',
            },
            {
              title: 'Ghi chú',
              field: 'Note',
              width: 150,
              headerHozAlign: 'center',
              formatter: 'textarea',
            },
          ],
        },
      ],
    });
  }
  //#endregion

  //#region Thêm/sửa khảo sát dự án
  updateProjectSurvey(status: number) {
    // 0 là thêm mới 1 là sửa
    // let selectedRows = this.tb_projectSurvey
    //   .getData()
    //   .filter((row: any) => row['Selected'] == true);
    // if (status == 1) {
    //   if (selectedRows.length != 1) {
    //     this.notification.error('', 'Vui lòng chọn 1 yêu cầu cần sửa!', {
    //       nzStyle: { fontSize: '0.75rem' },
    //     });
    //     return;
    //   }
    // }

    if(status !=0){
      var selectedRows = this.tb_projectSurvey.getSelectedData();
      // this.selectedList = dataSelect; // Cập nhật lại selectedList với dữ liệu mới nhất
      // const ids = this.selectedList.map((item) => item.ID);
      if (selectedRows.length == 0 || selectedRows.length >1) {
        this.notification.warning(
          'Thông báo',
          'Vui lòng chọn 1 yêu cầu để sửa!'
        );
        return;
      }
    }

    let modalRef = this.modalService.open(ProjectSurveyDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.projectId =
      selectedRows[0]['ProjectID'] > 0 && status == 1
        ? selectedRows[0]['ProjectID']
        : 0;
    modalRef.componentInstance.projectSurveyId =
      selectedRows[0]['ID'] > 0 && status == 1 ? selectedRows[0]['ID'] : 0;

    modalRef.result.catch((reason) => {
      if (reason == true) {
        this.getDataProjectSurvey();
      }
    });
  }
  //#endregion

  //#region Duyệt/Hủy duyệt gấp yêu cầu
  approved(approvedStatus: boolean, statusText: string, select: number) {
    let selectedRows = this.tb_projectSurvey
      .getData()
      .filter((row: any) => row['Selected'] == true);
    if (selectedRows.length <= 0) {
      this.notification.error(
        'Thông báo',
        `Vui lòng chọn yêu cầu cần ${statusText}!`,
        {
          nzStyle: { fontSize: '0.75rem' },
        }
      );
      return;
    }

    let requestIds = [...new Set(selectedRows.map((row: any) => row.ID))];

    console.log(requestIds);
    if (select == 1) {
      this.modal.confirm({
        nzTitle: `Thông báo`,
        nzContent: `Bạn có chắc muốn ${statusText} yêu cầu đã chọn không?`,
        nzOkText: 'Ok',
        nzOkType: 'primary',
        nzCancelText: 'Hủy',
        nzOnOk: () => {
          let data = {
            approvedStatus: approvedStatus,
            loginName: this.projectService.LoginName,
            globalEmployeeId: this.projectService.GlobalEmployeeId,
            ids: requestIds,
          };

          this.projectService.approvedUrgent(data).subscribe({
            next: (response: any) => {
              if (response.status == 1) {
                this.notification.success(
                  'Thông báo',
                  `Đã ${statusText} yêu cầu khảo sát!`,
                  {
                    nzStyle: { fontSize: '0.75rem' },
                  }
                );
                this.getDataProjectSurvey();
              }
            },
            error: (error) => {
              console.error('Lỗi:', error);
            },
          });
        },
      });
    } else {
      if (approvedStatus == false) this.isDisableReasion = true;
      if (selectedRows.length > 1) {
        this.notification.error(
          'Thông báo',
          `Vui lòng chỉ chọn 1 yêu cầu cần ${statusText}!`,
          {
            nzStyle: { fontSize: '0.75rem' },
          }
        );
        return;
      }
      this.technicalRequestId = selectedRows[0].EmployeeID;
      this.partOfDayId = selectedRows[0].SurveySession;
      this.reason = selectedRows[0].ReasonCancel;
      this.dateSurvey = selectedRows[0].DateSurvey
        ? DateTime.fromJSDate(new Date(selectedRows[0].DateSurvey)).toISO()
        : DateTime.local().toISO();
      let leaderID = selectedRows[0].LeaderID;
      let leaderName = selectedRows[0].FullNameLeaderTBP;
      if (this.projectService.GlobalEmployeeId != leaderID) {
        this.notification.error(
          'Thông báo',
          `Bạn không thể ${statusText} yêu cầu của leader [${leaderName}]!`,
          {
            nzStyle: { fontSize: '0.75rem' },
          }
        );
        return;
      }
      const modalRef = this.modal.create({
        nzTitle: `${statusText.toUpperCase()} YÊU CẦU`,
        nzContent: this.infoApprovedContainer,
        nzMaskClosable: false,
        nzFooter: [
          {
            label: 'Hủy',
            type: 'default',
            nzDanger: true,
            onClick: () => {
              modalRef.close();
            },
          },
          {
            label: 'Lưu',
            type: 'primary',
            onClick: () => {
              if (!this.technicalRequestId) {
                this.notification.error(
                  'Thông báo',
                  `Vui lòng chọn kỹ thuật yêu cầu!`,
                  {
                    nzStyle: { fontSize: '0.75rem' },
                  }
                );
                return;
              }
              let dsv = DateTime.fromJSDate(new Date(this.dateSurvey)).startOf(
                'day'
              );

              let ds = selectedRows[0].DateStart
                ? DateTime.fromJSDate(
                    new Date(selectedRows[0].DateStart)
                  ).startOf('day')
                : null;

              let de = selectedRows[0].DateEnd
                ? DateTime.fromJSDate(
                    new Date(selectedRows[0].DateEnd)
                  ).startOf('day')
                : null;

              if (ds && de) {
                if (dsv < ds || dsv > de) {
                  this.notification.error(
                    'Thông báo',
                    `Ngày khảo sát phải trong khoảng từ [${ds.toFormat(
                      'dd/MM/yyyy'
                    )}] đến [${de.toFormat('dd/MM/yyyy')}]!`,
                    {
                      nzStyle: { fontSize: '0.75rem' },
                    }
                  );
                  return;
                }
              }

              if (approvedStatus == false && !this.reason) {
                this.notification.error(
                  'Thông báo',
                  `Vui lòng nhập lý do hủy duyệt!`,
                  {
                    nzStyle: { fontSize: '0.75rem' },
                  }
                );
                return;
              }
              let dataSave = {
                id: selectedRows[0].ProjectSurveyDetailID,
                status: approvedStatus,
                employeeID: this.technicalRequestId,
                dateSurvey: DateTime.fromJSDate(
                  new Date(this.dateSurvey)
                ).toISO(),
                reasonCancel: this.reason ?? '',
                updatedBy: this.projectService.LoginName,
                surveySession: this.partOfDayId ?? 0,
              };

              this.projectService.approved(dataSave).subscribe({
                next: (response: any) => {
                  if (response.status == 1) {
                    this.notification.success(
                      'Thông báo',
                      `Đã cập nhật trạng thái ${statusText}!`,
                      {
                        nzStyle: { fontSize: '0.75rem' },
                      }
                    );
                    modalRef.close();
                    this.getDataProjectSurvey();
                  }
                },
                error: (error) => {
                  console.error('Lỗi:', error);
                },
              });
            },
          },
        ],
      });
    }
  }
  //#endregion

  //#region Xuất excel khảo sát dự án
  async exportExcel() {
    const table = this.tb_projectSurvey;
    if (!table) return;

    const data = table.getData();
    if (!data || data.length === 0) {
      if (!data || data.length === 0) {
        this.notification.error('Thông báo', 'Không có dữ liệu để xuất!');
        return;
      }
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Khảo sát dự án');

    const columns = table.getColumns();
    // Bỏ qua cột đầu tiên
    const filteredColumns = columns.slice(1);
    const headers = filteredColumns.map(
      (col: any) => col.getDefinition().title
    );
    worksheet.addRow(headers);

    let nums: number[] = [];
    const groupedData = new Map<string, any[]>();

    // Nhóm dữ liệu theo ProjectCode
    data.forEach((row: any) => {
      const type = row.ProjectCode || 'Chưa có mã dự án';
      if (!groupedData.has(type)) {
        groupedData.set(type, []);
      }
      groupedData.get(type)?.push(row);
    });

    // Duyệt qua từng nhóm và ghi dữ liệu
    groupedData.forEach((rows, projectCode) => {
      const groupRow = worksheet.addRow([` Mã dự án ${projectCode}`]);
      const groupRowIndex = groupRow.number;
      worksheet.mergeCells(`A${groupRowIndex}:D${groupRowIndex}`);
      nums.push(groupRowIndex);

      groupRow.font = { bold: true };
      groupRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Ghi dữ liệu thực tế của nhóm này
      rows.forEach((row: any) => {
        const rowData = filteredColumns.map((col: any, colIndex: number) => {
          const field = col.getField();
          let value = row[field];

          // Nếu là 2 cột đầu và kiểu boolean, chuyển thành checkbox biểu tượng
          if (
            (colIndex === 0 || colIndex === 1) &&
            typeof value === 'boolean'
          ) {
            return value ? '☑' : '☐';
          }
          // Format ngày nếu là ISO string
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            value = new Date(value);
          }

          return value;
        });
        const newRow = worksheet.addRow(rowData);

        // Căn giữa cột 1, 2; các cột khác giữ mặc định
        newRow.eachCell((cell, colNumber) => {
          cell.alignment = {
            wrapText: true,
            vertical: 'middle',
            horizontal: colNumber === 1 || colNumber === 2 ? 'center' : 'left',
          };
        });
      });
    });

    // Format cột có giá trị là Date
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // bỏ qua tiêu đề
      row.eachCell((cell, colNumber) => {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy'; // hoặc 'yyyy-mm-dd'
        }
      });
    });

    // Tự động căn chỉnh độ rộng cột
    worksheet.columns.forEach((column: any, colIndex: number) => {
      if (colIndex === 0) {
        column.width = 6;
        return;
      }

      let maxLength = 10;

      column.eachCell({ includeEmpty: true }, (cell: any) => {
        let cellValue = '';

        if (cell.value != null) {
          if (typeof cell.value === 'object') {
            if (cell.value.richText) {
              cellValue = cell.value.richText.map((t: any) => t.text).join('');
            } else if (cell.value.text) {
              cellValue = cell.value.text;
            } else if (cell.value.result) {
              cellValue = cell.value.result.toString();
            } else {
              cellValue = cell.value.toString();
            }
          } else {
            cellValue = cell.value.toString();
          }
        }

        const length = cellValue.length;
        maxLength = Math.max(maxLength, length + 1);
      });

      column.width = Math.min(maxLength, 20);
    });

    // Thêm bộ lọc cho toàn bộ cột (từ A1 đến cột cuối cùng)
    worksheet.autoFilter = {
      from: {
        row: 1,
        column: 1,
      },
      to: {
        row: 1,
        column: filteredColumns.length,
      },
    };

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const formattedDate = new Date()
      .toISOString()
      .slice(2, 10)
      .split('-')
      .reverse()
      .join('');

    let ds = DateTime.fromJSDate(new Date(this.dateStart)).toFormat('ddMMyy');
    let de = DateTime.fromJSDate(new Date(this.dateEnd)).toFormat('ddMMyy');
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `YeuCauKhaoSat${ds}_${de}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
  //#endregion
  //#region Xóa khảo sát dự án
  deletedSurvey(): void {
    // let selectedRows = this.tb_projectSurvey
    //   .getData()
    //   .filter((row: any) => row['Selected'] == true);
    // if (selectedRows.length != 1) {
    //   this.notification.error(
    //     'Thông báo',
    //     `Vui lòng chọn 1 yêu cầu muốn xóa!`,
    //     {
    //       nzStyle: { fontSize: '0.75rem' },
    //     }
    //   );
    //   return;
    // }

    var selectedRows = this.tb_projectSurvey.getSelectedData();
    // this.selectedList = dataSelect; // Cập nhật lại selectedList với dữ liệu mới nhất
    // const ids = this.selectedList.map((item) => item.ID);
    if (selectedRows.length == 0 || selectedRows.length >1) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn ít nhất 1 yêu cầu để xóa!'
      );
      return;
    }
    let emID = selectedRows[0]['EmployeeID'];
    if (
      emID != this.currentUser.ID &&
      !this.projectService.ISADMIN
    ) {
      this.notification.error(
        'Thông báo',
        `Bạn không thể xóa yêu cầu khảo sát của người khác!`,
        {
          nzStyle: { fontSize: '0.75rem' },
        }
      );
      return;
    }

    let dataSave = {
      projectSurveyId: selectedRows[0]['ID'],
    };

    this.projectService.checkStatusDetail(dataSave).subscribe({
      next: (response: any) => {
        if (response.data == true && !this.projectService.ISADMIN) {
          this.notification.error(
            'Thông báo',
            `Bạn không thể xóa yêu cầu khảo sát vì Leader Kỹ thuật đã xác nhận!`,
            {
              nzStyle: { fontSize: '0.75rem' },
            }
          );
          return;
        } else {
          this.projectService.deletedProjectSurvey(dataSave).subscribe({
            next: (response: any) => {
              if (response.status == 1) {
                this.notification.success(
                  'Thông báo',
                  `Đã xóa yêu cầu khảo sát dự án`,
                  {
                    nzStyle: { fontSize: '0.75rem' },
                  }
                );
                this.getDataProjectSurvey();
              }
            },
            error: (error) => {
              console.error('Lỗi:', error);
            },
          });
        }
      },
      error: (error: any) => {
        const msg = error.message || 'Lỗi không xác định';
        this.notification.error('Thông báo', msg);
        console.error('Lỗi:', error.error);
      },
    });
  }
  //#endregion

  //#region cây thư mục
  openFolder(): void {
    let selectedRows = this.tb_projectSurvey
      .getData()
      .filter((row: any) => row['Selected'] == true);
    if (selectedRows.length != 1) {
      this.notification.error(
        'Thông báo',
        `Vui lòng chọn 1 yêu cầu khảo sát!`,
        {
          nzStyle: { fontSize: '0.75rem' },
        }
      );
      return;
    }

    let prjId = selectedRows[0]['ProjectID'];
    let data = this.projects.find((p: any) => p.ID === prjId);
    if (data.CreatedDate) {
      let year = new Date(data.CreatedDate).getFullYear();
      let dt = {
        year: year,
        projectCode: data.ProjectCode,
      };
      this.projectService.openFolder(dt).subscribe({
        next: (response: any) => {},
        error: (error) => {
          console.error('Lỗi:', error);
          this.notification.error(
            'Thông báo',
            `Lỗi mở cây thư mục dự án ${data.ProjectCode}!`,
            {
              nzStyle: { fontSize: '0.75rem' },
            }
          );
        },
      });
    }
  }
  //#endregion

  //#region kết quả khảo sát
  surveyResult(): void {
    let selectedRows = this.tb_projectSurvey
      .getData()
      .filter((row: any) => row['Selected'] == true);
    if (selectedRows.length != 1) {
      this.notification.error(
        'Thông báo',
        `Vui lòng chọn 1 yêu cầu khảo sát!`,
        {
          nzStyle: { fontSize: '0.75rem' },
        }
      );
      return;
    }

    let employeeID = selectedRows[0]['EmployeeID'];
    let prjSurveyDetailID = selectedRows[0]['ProjectSurveyDetailID'];

    if (
      this.projectService.GlobalEmployeeId != employeeID ||
      !this.projectService.ISADMIN
    ) {
      this.notification.error(
        'Thông báo',
        `Bạn không được nhập kết quả của người khác!`,
        {
          nzStyle: { fontSize: '0.75rem' },
        }
      );
      return;
    }

    let dt = {
      projectSurveyDetailId: prjSurveyDetailID,
    };
    this.projectService.getDetailByid(dt).subscribe({
      next: (response: any) => {
        const modalRef = this.modal.create({
          nzTitle: `Kết quả khảo sát`,
          nzContent: this.resultSurveyContainer,
          nzMaskClosable: false,
          nzFooter: [
            {
              label: 'Hủy',
              type: 'default',
              nzDanger: true,
              onClick: () => {
                (this.fileDeletedIds = []),
                  (this.result = ''),
                  (this.employeeIdResult = 0),
                  (this.fileListResult = []);
                modalRef.close();
              },
            },
            {
              label: 'Lưu',
              type: 'primary',
              onClick: () => {
                const formData = new FormData();
                let projectSurveyId = selectedRows[0]['ID'];
                let projectId = selectedRows[0]['ProjectID'];
                let projectTypeId = selectedRows[0]['ProjectTypeID'];
                let projectSurveyDetailId =
                  selectedRows[0]['ProjectSurveyDetailID'];
                let data = this.projects.find((p: any) => p.ID === projectId);
                let year = new Date(data.CreatedDate).getFullYear();

                this.fileListResult.forEach((f) => {
                  formData.append('files', f.originFile as File, f.name);
                });

                formData.append('projectSurveyId', `${projectSurveyId}`);
                formData.append('projectTypeId', projectTypeId);
                formData.append('result', this.result);
                formData.append('projectSurveyDetailId', projectSurveyDetailId);
                formData.append('projectId', projectId);
                this.projectService
                  .saveProjectSurveyResult(formData)
                  .subscribe({
                    next: (response: any) => {
                      (this.fileDeletedIds = []),
                        (this.result = ''),
                        (this.employeeIdResult = 0),
                        (this.fileListResult = []);
                      this.getDataProjectSurvey();
                    },
                    error: (error) => {
                      console.error('Lỗi:', error);
                      this.notification.error(
                        'Thông báo',
                        `Lỗi lưu kết quả khảo sát dự án ${data.ProjectCode}!`,
                        {
                          nzStyle: { fontSize: '0.75rem' },
                        }
                      );
                    },
                  });
              },
            },
          ],
        });

        modalRef.afterOpen.subscribe(() => {
          this.drawTbProjectSurveyFile(
            this.tb_projectSurveyFileContainer.nativeElement,
            response.data.files
          );
          this.employeeIdResult = response.data.detail.EmployeeID;
          this.dateResult = response.data.detail.DateSurvey
            ? DateTime.fromJSDate(
                new Date(response.data.detail.DateSurvey)
              ).toISO()
            : DateTime.local().toISO();
          this.result = response.data.detail.Result;

          console.log(response.data.files);
          console.log(response.data.detail);
        });
      },
      error: (error) => {
        console.error('Lỗi:', error);
        this.notification.error(
          'Thông báo',
          `Không tìm thấy nội dung kết quả khảo sát!`,
          {
            nzStyle: { fontSize: '0.75rem' },
          }
        );
      },
    });
  }

  beforeUpload = (file: any): boolean => {
    console.log('file', file);
    const newFile = {
      uid: Math.random().toString(36).substring(2),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'new',
      originFile: file,
      FileName: '',
      ServerPath: '',
      OriginName: file.name,
    };
    this.fileListResult = [...this.fileListResult, newFile];
    this.updateFileTable();
    return false;
  };

  updateFileTable() {
    if (this.tb_projectSurveyFile) {
      // Lấy dữ liệu hiện tại trong bảng
      const currentData = this.tb_projectSurveyFile.getData();

      // Lọc file chưa bị xóa
      const activeFiles = this.fileListResult.filter(
        (file: any) => !file.isDeleted && !file.IsDeleted
      );

      // Lọc ra những file chưa tồn tại trong bảng
      const newFiles = activeFiles.filter((file: any) => {
        const fileName = file.name || file.FileName;
        return !currentData.some((row: any) => row.FileName === fileName);
      });

      // Map thành đúng định dạng bảng
      const fileData = newFiles.map((file: any) => ({
        ID: 0,
        FileName: file.name || file.FileName,
        ServerPath: file.ServerPath || '',
        OriginName: file.name || file.OriginName,
        file: file,
      }));

      // Chỉ add nếu có dữ liệu mới
      if (fileData.length > 0) {
        this.tb_projectSurveyFile.addData(fileData);
      }
    }
  }
  //#endregion
  //#region Xử lý bảng file
  drawTbProjectSurveyFile(container: HTMLElement, data: any) {
    this.tb_projectSurveyFile = new Tabulator(container, {
      height: '100%',
      layout: 'fitDataStretch',
      locale: 'vi',
      data: data,
      columns: [
        {
          title: '',
          headerHozAlign: 'center',
          headerSort: false,
          formatter: (cell) => {
            const data = cell.getRow().getData();
            let isDeleted = data['IsDeleted'];
            return !isDeleted && data['ID'] <= 0
              ? `<button id="btn-header-click" class="btn text-danger p-0 border-0" style="font-size: 0.75rem;"><i class="fas fa-trash"></i></button>`
              : '';
          },
          cellClick: (e, cell) => {
            let data = cell.getRow().getData();
            let id = data['ID'];
            let fileName = data['FileName'];
            if (id > 0) return;
            this.modal.confirm({
              nzTitle: `Bạn có chắc chắn muốn xóa file`,
              nzContent: `${fileName}?`,
              nzOkText: 'Xóa',
              nzOkType: 'primary',
              nzCancelText: 'Hủy',
              nzOkDanger: true,
              nzOnOk: () => {
                if (id > 0) {
                  if (!this.fileDeletedIds.includes(id))
                    this.fileDeletedIds.push(id);
                  this.tb_projectSurveyFile.deleteRow(cell.getRow());
                } else {
                  this.fileListResult = this.fileListResult.filter(
                    (f) => f.name !== fileName
                  );
                  this.tb_projectSurveyFile.deleteRow(cell.getRow());
                }
              },
            });
          },
          width: '5px',
          hozAlign: 'center',
        },
        {
          title: 'Tên file',
          field: 'FileName',
          headerHozAlign: 'center',
          width: '18px',
        },
      ],
    });
  }
  //#endregion
}
