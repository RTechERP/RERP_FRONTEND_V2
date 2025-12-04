import { Title } from '@angular/platform-browser';
import {
  Component,
  Input,
  TemplateRef,
  ViewEncapsulation,
  inject,
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
import { ProjectSurverResultComponent } from './project-surver-result/project-surver-result.component';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzFormModule } from 'ng-zorro-antd/form';
import { AuthService } from '../../../auth/auth.service';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { NOTIFICATION_TITLE } from '../../../app.config';

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
    NzUploadModule,
    NzFormModule,
    ReactiveFormsModule,
    HasPermissionDirective
  ],
  //encapsulation: ViewEncapsulation.None,
  templateUrl: './project-survey.component.html',
  styleUrl: './project-survey.component.css',
})
export class ProjectSurveyComponent implements AfterViewInit {
  //#region Khai báo biến
  private fb = inject(NonNullableFormBuilder);
  
  // FormGroup cho modal approval
  approvalForm = this.fb.group({
    technicalRequestId: this.fb.control<number | null>(null, [Validators.required]),
    dateSurvey: this.fb.control<string>('', [Validators.required]),
    partOfDayId: this.fb.control<number>(0),
    reason: this.fb.control<string>('')
  });

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

  tb_projectSurvey: any;
  sizeSearch: string = '0';
  isLoadTable: any = false;

  employees: any[] = [];
  projects: any[] = [];

  // dateStart: tính từ ngày hôm nay trừ đi 1 tháng
  dateStart: any = DateTime.local()
    .minus({ month: 1 })
    .set({ hour: 0, minute: 0, second: 0 })
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
      this.notification.error(NOTIFICATION_TITLE.error, msg);
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
        this.notification.error(NOTIFICATION_TITLE.error, msg);
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
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi:', error.error);
      },
    });
  }

  reset() {
    this.dateStart = DateTime.local()
      .minus({ month: 1 })
      .set({ hour: 0, minute: 0, second: 0 })
      .toISO();
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
      keyword:  this.keyword?.trim() ?? '',
    };

    this.projectService.getDataProjectSurvey(data).subscribe({
      next: (response: any) => {
        this.tb_projectSurvey.setData(response.data);
        console.log("kết quả khairoe sát", response.data);
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
      ...DEFAULT_TABLE_CONFIG,
      
        height: '100%',
        layout: 'fitColumns',
        locale: 'vi',
        selectableRows:1,
        rowHeader: false,
   paginationMode: 'local',
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
            {
              title: 'Khảo sát gấp',
              field: 'IsUrgent',
              width: 50,
              frozen:true,
              headerSort: false,
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
              width: 50,
              frozen:true,
              headerSort: false,
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
              width: 100,
              headerSort: false,
              headerHozAlign: 'center',
            },
            {
              title: 'Từ ngày',
              field: 'DateStart',
              width: 100,
              headerSort: false,
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
              width: 100,
              headerSort: false,
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
              width: 250,
              headerHozAlign: 'center',
              formatter: 'textarea',
            },
            {
              title: 'Địa chỉ',
              field: 'Address',
              width: 250,
              headerHozAlign: 'center',
              formatter: 'textarea',
            },
            {
              title: 'Kiểu khảo sát',
              field: 'ProjectTypeName',
              width: 80,
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
              width: 80,
              headerHozAlign: 'center',
            },
            {
              title: 'PIC',
              field: 'PIC',
              width: 200,
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
              title: 'EmployeeID1',
              field: 'EmployeeID1',
              visible: false,
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

    let selectedRows: any[] = [];
    let canEdit: boolean = true; // Mặc định có quyền sửa
    
    if(status !=0){
      debugger
      selectedRows = this.tb_projectSurvey.getSelectedData();
      // this.selectedList = dataSelect; // Cập nhật lại selectedList với dữ liệu mới nhất
      // const ids = this.selectedList.map((item) => item.ID);
      if (selectedRows.length == 0 || selectedRows.length >1) {
        this.notification.warning(
          'Thông báo',
          'Vui lòng chọn 1 yêu cầu để sửa!'
        );
        return;
      }
      debugger;
      // Kiểm tra quyền sửa: nếu không phải chủ sở hữu và không phải admin thì không có quyền
      if(selectedRows[0].EmployeeID != this.currentUser.EmployeeID && !this.currentUser.IsAdmin){
        canEdit = false; // Không có quyền sửa, nhưng vẫn mở modal để xem
      }
      if(selectedRows[0].EmployeeID1 != this.currentUser.EmployeeID && !this.currentUser.IsAdmin){
        canEdit = false;
      }
    }

    let modalRef = this.modalService.open(ProjectSurveyDetailComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.projectId =
      selectedRows.length > 0 && selectedRows[0]['ProjectID'] > 0 && status == 1
        ? selectedRows[0]['ProjectID']
        : 0;
    modalRef.componentInstance.projectSurveyId =
      selectedRows.length > 0 && selectedRows[0]['ID'] > 0 && status == 1 ? selectedRows[0]['ID'] : 0;
    modalRef.componentInstance.isEdit = status;
    modalRef.componentInstance.canEdit = canEdit; // Truyền quyền sửa vào form detail
    modalRef.result.catch((reason) => {
      if (reason == true) {
        this.getDataProjectSurvey();
      }
    });
  }
  //#endregion

  //#region Duyệt/Hủy duyệt gấp yêu cầu
  approved(approvedStatus: boolean, statusText: string, select: number) {
    var selectedRows = this.tb_projectSurvey.getSelectedData();
    if (selectedRows.length <= 0) {
      this.notification.error(
       NOTIFICATION_TITLE.error,
        `Vui lòng chọn yêu cầu cần ${statusText}!`,
        {
          nzStyle: { fontSize: '0.75rem' },
        }
      );
      return;
    }
    debugger;
    if(this.currentUser.EmployeeID != selectedRows[0].LeaderID){
      this.notification.error(NOTIFICATION_TITLE.error,
        `Bạn không thể ${statusText} yêu cầu của leader [${selectedRows[0].FullNameLeaderTBP}]!`,
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
       
        nzOnOk: () => {
          let data = {
            approvedStatus: approvedStatus,
            loginName: this.currentUser.LoginName,
            globalEmployeeId: this.currentUser.EmployeeID,
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
        this.notification.error(NOTIFICATION_TITLE.error,
          `Vui lòng chỉ chọn 1 yêu cầu cần ${statusText}!`,
          {
            nzStyle: { fontSize: '0.75rem' },
          }
        );
        return;
      }
      // Khởi tạo form với giá trị từ selected row
      // Nếu có DateSurvey thì dùng DateSurvey, nếu không thì dùng DateEnd, nếu không có DateEnd thì dùng ngày hiện tại
      // nz-date-picker nhận Date object, không phải ISO string
      let initialDateSurvey: Date;
      if (selectedRows[0].DateSurvey) {
        initialDateSurvey = new Date(selectedRows[0].DateSurvey);
      } else if (selectedRows[0].DateEnd) {
        initialDateSurvey = new Date(selectedRows[0].DateEnd);
      } else {
        initialDateSurvey = new Date();
      }
      
      // Lấy ID kỹ thuật phụ trách từ selected row
      // Có thể là TechnicalID, EmployeeIDTechnical, hoặc field khác tùy vào cấu trúc dữ liệu
      const technicalId = selectedRows[0].EmployeeID1 || 
                          null
      
      this.approvalForm.patchValue({
        technicalRequestId: selectedRows[0].EmployeeID1|| null,
        partOfDayId: selectedRows[0].SurveySession || 0,
        reason: selectedRows[0].ReasonCancel || '',
        dateSurvey: initialDateSurvey as any // Cast to any vì form control type là string nhưng nz-date-picker trả về Date
      });

      // Set required validator cho reason nếu là hủy duyệt
      if (approvedStatus === false) {
        this.approvalForm.get('reason')?.setValidators([Validators.required]);
        this.isDisableReasion = true;
      } else {
        this.approvalForm.get('reason')?.clearValidators();
        this.approvalForm.get('reason')?.updateValueAndValidity();
        this.isDisableReasion = false;
      }

      let leaderID = selectedRows[0].LeaderID;
      let leaderName = selectedRows[0].FullNameLeaderTBP;
      if (this.currentUser.EmployeeID != leaderID) {
        this.notification.error(NOTIFICATION_TITLE.error,
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
        nzWrapClassName: 'modal-primary-header',
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
              // Validate form
              if (this.approvalForm.invalid) {
                this.approvalForm.markAllAsTouched();
                const technicalControl = this.approvalForm.get('technicalRequestId');
                const dateControl = this.approvalForm.get('dateEnd');
                const reasonControl = this.approvalForm.get('reason');
                
                if (technicalControl?.hasError('required')) {
                  this.notification.error(
                    'Thông báo',
                    'Vui lòng chọn kỹ thuật yêu cầu!',
                    { nzStyle: { fontSize: '0.75rem' } }
                  );
                } else if (dateControl?.hasError('required')) {
                  this.notification.error(
                    'Thông báo',
                    'Vui lòng chọn ngày khảo sát!',
                    { nzStyle: { fontSize: '0.75rem' } }
                  );
                } else if (reasonControl?.hasError('required')) {
                  this.notification.error(
                    'Thông báo',
                    'Vui lòng nhập lý do hủy duyệt!',
                    { nzStyle: { fontSize: '0.75rem' } }
                  );
                }
                return;
              }

              const formValue = this.approvalForm.getRawValue();
              // Xử lý dateSurvey: nz-date-picker trả về Date object, nhưng form control type là string
              const dateSurveyRaw = formValue.dateSurvey as any;
              
              // Validate và convert dateSurvey
              if (!dateSurveyRaw) {
                this.notification.error('Thông báo', 'Vui lòng chọn ngày khảo sát!');
                return;
              }

              let dateSurveyValue: DateTime;
              let dateSurveyISO: string;
              
              if (dateSurveyRaw instanceof Date) {
                dateSurveyValue = DateTime.fromJSDate(dateSurveyRaw).startOf('day');
                dateSurveyISO = DateTime.fromJSDate(dateSurveyRaw).toISO() || '';
              } else if (typeof dateSurveyRaw === 'string' && dateSurveyRaw) {
                dateSurveyValue = DateTime.fromISO(dateSurveyRaw).startOf('day');
                dateSurveyISO = DateTime.fromISO(dateSurveyRaw).toISO() || '';
              } else {
                this.notification.error('Thông báo', 'Ngày khảo sát không hợp lệ!');
                return;
              }

              let dsv = dateSurveyValue;

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

              let dataSave = {
                id: selectedRows[0].ProjectSurveyDetailID,
                status: approvedStatus,
                employeeID: formValue.technicalRequestId!,
                dateSurvey: dateSurveyISO,
                reasonCancel: formValue.reason ?? '',
                updatedBy: this.currentUser.FullName,
                surveySession: formValue.partOfDayId ?? 0,
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
                  this.notification.error(NOTIFICATION_TITLE.error, error.error.message);
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
        this.notification.error(NOTIFICATION_TITLE.error, 'Không có dữ liệu để xuất!');
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
    debugger;
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
      !this.currentUser.IsAdmin
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
     // if (response.data == true && !this.projectService.ISADMIN) {
        //   this.notification.error(
        //     'Thông báo',
        //     `Bạn không thể xóa yêu cầu khảo sát vì Leader Kỹ thuật đã xác nhận!`,
        //     {
        //       nzStyle: { fontSize: '0.75rem' },
        //     }
        //   );
        //   return;
        // } else {

    let dataSave = {
      projectSurveyId: selectedRows[0]['ID'],
    };
    this.projectService.checkStatusDetail(dataSave).subscribe({
      next: (response: any) => {
       
          this.modal.confirm({
            nzTitle: `Thông báo`,
            nzContent: `Bạn có chắc muốn xóa yêu cầu khảo sát dự án đã chọn?`,
            nzOkText: 'Ok',
            nzOkType: 'primary',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
              this.projectService.deletedProjectSurvey(dataSave).subscribe({
                next: (response: any) => {
                  if (response.status == 1) {
                    this.notification.success(
                      'Thông báo',
                      `Đã xóa yêu cầu khảo sát dự án!`
                    );
                    this.getDataProjectSurvey();
                  }else if(response.status == 2){
                    this.notification.error(
                      'Thông báo',
                      response.message
                    );
                  }
                },
                error: (error: any) => {
                  const msg = error.message || 'Lỗi không xác định';
                  this.notification.error(NOTIFICATION_TITLE.error, msg);
                  console.error('Lỗi:', error.error);
                },
              });
            },
          });
        }
      
    });
  }
  //#endregion

  //#region cây thư mục
  openFolder(): void {
    var selectedRows = this.tb_projectSurvey.getSelectedData();
    if (selectedRows.length <= 0) {
      this.notification.error(
       NOTIFICATION_TITLE.error,
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
            NOTIFICATION_TITLE.error,
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
    var selectedRows = this.tb_projectSurvey.getSelectedData();
    if (selectedRows.length != 1) {
      this.notification.error(
       NOTIFICATION_TITLE.error,
        `Vui lòng chọn 1 yêu cầu khảo sát!`,
      );
      return;
    }

    let employeeID = selectedRows[0]['EmployeeID'];
    let prjSurveyDetailID = selectedRows[0]['ProjectSurveyDetailID'];
    let canEdit = true;

    // if (
    //   this.currentUser.EmployeeID != employeeID &&
    //   !this.currentUser.IsAdmin
    // ) {
    //   this.notification.error(
    //    NOTIFICATION_TITLE.error,
    //     `Bạn không được nhập kết quả của người khác!`,
    //   );
    //   return;
    // }
    if(selectedRows[0].EmployeeID1 != this.currentUser.EmployeeID && !this.currentUser.IsAdmin){
      canEdit = false;
    }
    let modalRef = this.modalService.open(ProjectSurverResultComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.projectSurveyDetailId = prjSurveyDetailID;
    modalRef.componentInstance.projectSurveyId = selectedRows[0]['ID'];
    modalRef.componentInstance.projectId = selectedRows[0]['ProjectID'];
    modalRef.componentInstance.projectTypeId = selectedRows[0]['ProjectTypeID'];
    modalRef.componentInstance.employeeID = employeeID;
    modalRef.componentInstance.projects = this.projects;
    modalRef.componentInstance.employees = this.employees;
    modalRef.componentInstance.canEdit = canEdit;
    modalRef.result.catch((reason) => {
      if (reason == true || reason?.success) {
        this.getDataProjectSurvey();
      }
    });
  }
  //#endregion
}
