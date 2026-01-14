import { Component, ElementRef, ViewChild, OnInit, AfterViewInit, EventEmitter, Output, Input } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CommonModule, NgIf } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, Form } from '@angular/forms';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { DateTime } from 'luxon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { FormControl } from '@angular/forms';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { EmployeeService } from '../../employee/employee-service/employee.service';
import { OverTimeService } from '../over-time-service/over-time.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { HasPermissionDirective } from "../../../../directives/has-permission.directive";
@Component({
  selector: 'app-over-time-detail',
  templateUrl: './over-time-detail.component.html',
  styleUrls: ['./over-time-detail.component.css'],
  imports: [
    CommonModule,
    NzModalModule,
    NzIconModule,
    NzButtonModule,
    NzTabsModule,
    NzTableModule,
    NzSelectModule,
    NzFormModule,
    NzInputModule,
    NzNotificationModule,
    ReactiveFormsModule,
    NzIconModule,
    NzCheckboxModule,
    NzInputNumberModule,
    NzDatePickerModule,
    NzTabsModule,
    NzSplitterModule,
    NgIf,
    NzSpinModule,
    HasPermissionDirective
  ]
})
export class OverTimeDetailComponent implements OnInit, AfterViewInit {

  @Output() employeeOverTimeDetail = new EventEmitter<void>();
  @Input() detailData: any[] = [];
  private tabulator!: Tabulator;
  isLoading = false;
  employeeList: any[] = [];
  approverList: any[] = [];
  employeeTypeOverTimeList: any[] = [];
  searchForm!: FormGroup;
  overTimeDetail: any[] = [];


  // Thêm mảng để map location value với label
  locationList = [
    { value: 0, label: '--Chọn địa điểm--' },
    { value: 1, label: 'Văn phòng' },
    { value: 2, label: 'Địa điểm công tác' },
    { value: 3, label: 'Tại nhà' },
  ];

  constructor(
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private employeeService: EmployeeService,
    private overTimeService: OverTimeService
  ) { }

  ngOnInit() {
    this.initSearchForm();
    this.loadApprover();
    this.loadEmployee();
    this.loadEmployeeTypeOverTime();
    this.loadDetailData();
  }

  ngOnChanges() {
    console.log(this.detailData);
    if (this.detailData && this.detailData.length > 0) {
      this.loadDetailData();
    } else {
      this.initSearchForm();
      this.tabulator.setData([]);
    }
  }

  loadDetailData() {
    // Set form values from the first item in detail data
    const firstItem = this.detailData[0];
    console.log(firstItem);
    console.log(firstItem['ApprovedID']);
    this.searchForm.patchValue({
      employeeId: firstItem['EmployeeID'],
      approverId: Number(firstItem['ApprovedID']),
      dateRegister: new Date(firstItem['DateRegister'])
    });

    // Gán lại STT cho từng dòng dữ liệu
    if (this.detailData && this.detailData.length > 0) {
      this.detailData.forEach((item, idx) => {
        item.STT = idx + 1;
      });
    }

    // Load data into tabulator
    if (this.tabulator) {
      this.tabulator.setData(this.detailData);
    } else {
      this.overTimeDetail = this.detailData;
    }
  }

  ngAfterViewInit(): void {
    // Delay initialization to ensure data is loaded
    setTimeout(() => {
      this.initializeTabulator();
      this.loadDetailData();
    }, 100);
  }

  loadEmployee() {
    this.employeeService.getAllEmployee().subscribe({
      next: (data) => {
        this.employeeList = data.data;
      },
      error: (error) => {
        this.notification.warning("Lỗi", "Lỗi khi lấy danh sách nhân viên");
      }
    })
  }

  loadApprover() {
    this.employeeService.getEmployeeApproved().subscribe({
      next: (data) => {
        this.approverList = data.data;
      },
      error: (error) => {
        this.notification.warning("Lỗi", "Lỗi khi lấy danh sách người duyệt");
      }
    })
  }

  loadEmployeeTypeOverTime() {
    this.overTimeService.getEmployeeTypeOverTime().subscribe({
      next: (data) => {
        if (data.data && Array.isArray(data.data)) {
          this.employeeTypeOverTimeList = data.data.map((type: any) => ({
            value: type.ID,
            label: `${type.TypeCode} - ${type.Type} (${type.Ratio}%)`,
            typeData: type // Lưu toàn bộ dữ liệu để tham khảo sau này
          }));
          if (this.tabulator) {
            this.destroyTabulator();
            this.initializeTabulator();
          }
        } else {
          this.employeeTypeOverTimeList = [];
        }
      },
      error: (error) => {
        this.notification.warning("Lỗi", "Lỗi khi lấy danh sách loại làm thêm")
      }
    })
  }

  private destroyTabulator() {
    if (this.tabulator) {
      this.tabulator.destroy();
      this.tabulator = null as any;
    }
  }




  private initSearchForm() {
    this.searchForm = this.fb.group({
      approverId: null,
      employeeId: null,
      dateRegister: new Date()
    });
  }

  resetSTT() {
    const rows = this.tabulator.getRows();
    rows.forEach((row, index) => {
      row.update({ STT: index + 1 });
    });
  }

  private initializeTabulator(): void {
    this.tabulator = new Tabulator('#tb_over_time_detail', {
      data: this.overTimeDetail, // Initialize with empty array
      layout: 'fitColumns',
      height: '70vh',
      columns: [
        {
          title: '+',
          field: 'addRow',
          headerSort: false,
          formatter: 'buttonCross', // 'X' button for deleting rows in cells
          width: 40,
          hozAlign: 'center',
          headerHozAlign: 'center',
          headerFormatter: function () {
            return "<i class='fas fa-plus-circle text-primary' style='cursor:pointer;font-size:2rem;' title='Thêm dòng'></i>";
          },
          headerClick: (e: any, column: any) => {
            this.addRow();
          },
          cellClick: (e: any, cell: any) => {
            cell.getRow().delete(); // Delete row on 'X' button click
            this.resetSTT();
          }
        } as any,
        { title: 'STT', field: 'STT', editor: 'input', hozAlign: 'center', headerHozAlign: 'center', width: 80 },
        {
          title: 'Thời gian bắt đầu',
          field: 'TimeStart',
          editor: 'input',
          editorParams: {
            elementAttributes: {
              type: 'datetime-local'
            }
          },
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 200,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (value) {
              try {
                // Chuyển đổi từ datetime-local format sang hiển thị
                const date = new Date(value);
                return DateTime.fromJSDate(date).toFormat('dd/MM/yyyy HH:mm');
              } catch {
                return value;
              }
            }
            return '';
          }
        },
        {
          title: 'Thời gian kết thúc',
          field: 'EndTime',
          editor: 'input',
          editorParams: {
            elementAttributes: {
              type: 'datetime-local'
            }
          },
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 200,
          formatter: (cell: any) => {
            const value = cell.getValue();
            if (value) {
              try {
                const date = new Date(value);
                return DateTime.fromJSDate(date).toFormat('dd/MM/yyyy HH:mm');
              } catch {
                return value;
              }
            }
            return '';
          }
        },
        {
          title: 'Địa điểm',
          field: 'Location',
          editor: 'list', // Thay đổi thành list editor
          editorParams: {
            values: this.locationList
          },
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 300,
          formatter: (cell: any) => {
            const value = cell.getValue();
            const location = this.locationList.find((loc: any) => loc.value === value);
            return location ? location.label : value;
          }
        },
        // {
        //   title: 'Ăn tối', field: 'Overnight', hozAlign:'center',headerHozAlign:'center', width: 80,
        //   formatter: function (cell: any) {
        //     const value = cell.getValue();
        //     const checked = value === true || value === 'true' || value === 1 || value === '1';
        //     return `<input type="checkbox" ${checked ? 'checked' : ''} />`;
        //   },
        // },
        {
          title: 'Ăn tối',
          field: 'Overnight',
          hozAlign: 'center',
          headerHozAlign: 'center',
          width: 80,
          formatter: function (cell) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = checked;

            // Add event listener to update cell value when checkbox changes
            input.addEventListener('change', () => {
              cell.setValue(input.checked); // Update the cell's value to true/false
            });

            return input;
          },
          // Ensure the cell's value is always a boolean
          mutator: function (value) {
            return value === true || value === 'true' || value === 1 || value === '1';
          }
        },
        {
          title: 'Loại',
          field: 'TypeID',
          editor: 'list',
          editorParams: {
            values: this.employeeTypeOverTimeList
          },


          formatter: (cell: any) => {
            const value = cell.getValue();
            const type = this.employeeTypeOverTimeList.find((emp: any) => emp.value === value);
            return type ? type.label : value;
          },
          hozAlign: 'left',
          headerHozAlign: 'center',
          width: 350
        },
        { title: 'Lý do', field: 'Reason', editor: 'input', hozAlign: 'left', headerHozAlign: 'center', width: 500 },
        { title: 'Lý do sửa', field: 'ReasonHREdit', editor: 'input', hozAlign: 'left', headerHozAlign: 'center', width: 500 },
      ]
    });
    if (this.tabulator) {
      this.tabulator.on('cellEdited', (cell: any) => {
        const value = cell.getValue();
        const field = cell.getField();


        // Validation cho thời gian
        if ((field === 'TimeStart' || field === 'EndTime') && value) {
          try {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              this.notification.warning(NOTIFICATION_TITLE.error, 'Vui lòng nhập thời gian đúng định dạng');
              cell.setValue('');
              return;
            }
          } catch (error) {
            this.notification.warning(NOTIFICATION_TITLE.error, 'Định dạng thời gian không hợp lệ');
            cell.setValue('');
            return;
          }
        }


        // Validation cho thời gian kết thúc phải sau thời gian bắt đầu
        if (field === 'EndTime' || field === 'TimeStart') {
          const rowData = cell.getRow().getData();
          if (rowData.TimeStart && rowData.EndTime) {
            const startTime = new Date(rowData.TimeStart);
            const endTime = new Date(rowData.EndTime);
            if (startTime >= endTime) {
              this.notification.warning(NOTIFICATION_TITLE.error, 'Thời gian kết thúc phải sau thời gian bắt đầu');
              cell.setValue('');
              return;
            }
          }
        }


        this.overTimeDetail = this.tabulator!.getData();
      });
      this.tabulator.on('dataChanged', () => {
        this.overTimeDetail = this.tabulator!.getData();
      });
    }
  }

  addRow() {
    if (this.tabulator) {
      const data = this.tabulator.getData();
      // Tìm STT lớn nhất hiện tại, nếu chưa có thì là 0
      const maxSTT = data.length > 0 ? Math.max(...data.map((row: any) => Number(row.STT) || 0)) : 0;
      this.tabulator.addRow({ STT: maxSTT + 1 });
    }
  }

  onSubmit() {
    if (!this.checkValidate()) {
      return;
    }

    const employeeOverTime = this.tabulator?.getData() || [];
    const data = this.searchForm.value;
    const formData = {
      EmployeeOvertimes: employeeOverTime.map(item => {
        const isEdit = item.ID && item.ID > 0;
        return {
          ID: item.ID || 0,
          EmployeeID: data.employeeId,
          ApprovedID: data.approverId,
          DateRegister: data.dateRegister,
          TimeStart: item.TimeStart,
          EndTime: item.EndTime,
          Location: item.Location,
          Overnight: item.Overnight,
          TypeID: item.TypeID,
          Reason: item.Reason,
          ReasonHREdit: item.ReasonHREdit,
          // Reset trạng thái duyệt khi sửa
          IsApproved: isEdit ? false : undefined,
          IsApprovedHR: isEdit ? false : undefined,
        };
      })
    }
    this.overTimeService.saveEmployeeOverTime(formData).subscribe({
      next: (response) => {
        this.employeeOverTimeDetail.emit();
        this.closeModal();
        this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật đăng ký làm thêm thành công');
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Cập nhật đăng ký làm thêm thất bại');
      }
    })
  }

  closeModal() {
    const modal = document.getElementById('overTimeModal');
    if (modal) {
      (window as any).bootstrap.Modal.getInstance(modal).hide();
    }
  }


  checkValidate(): boolean {
    // Kiểm tra nhân viên
    if (!this.searchForm.value.employeeId || this.searchForm.value.employeeId <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.error, 'Vui lòng chọn nhân viên!');
      return false;
    }

    // Kiểm tra người duyệt
    if (!this.searchForm.value.approverId || this.searchForm.value.approverId <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.error, 'Vui lòng chọn người duyệt!');
      return false;
    }

    // Lấy dữ liệu từ Tabulator
    const tabulatorData = this.tabulator?.getData() || [];

    // Kiểm tra từng dòng làm thêm
    for (let i = 0; i < tabulatorData.length; i++) {
      const row = tabulatorData[i];
      const stt = row.STT || (i + 1);

      const timeStart = row.TimeStart ? new Date(row.TimeStart) : null;
      const endTime = row.EndTime ? new Date(row.EndTime) : null;
      const location = row.Location;
      const type = row.TypeID;
      const reason = (row.Reason || '').trim();
      const reasonEdit = (row.ReasonHREdit || '').trim();
      const id = row.ID || 0;

      if (!timeStart || isNaN(timeStart.getTime())) {
        this.notification.warning(NOTIFICATION_TITLE.error, `Vui lòng nhập Thời gian bắt đầu [STT: ${stt}]!`);
        return false;
      }
      if (!endTime || isNaN(endTime.getTime())) {
        this.notification.warning(NOTIFICATION_TITLE.error, `Vui lòng nhập Thời gian kết thúc [STT: ${stt}]!`);
        return false;
      }
      if ((endTime.getTime() - timeStart.getTime()) <= 0) {
        this.notification.warning(NOTIFICATION_TITLE.error, `Thời gian kết thúc phải lớn hơn thời gian bắt đầu [STT: ${stt}]!`);
        return false;
      }
      if (!location || location <= 0) {
        this.notification.warning(NOTIFICATION_TITLE.error, `Vui lòng nhập Địa điểm [STT: ${stt}]!`);
        return false;
      }
      if (!type || type <= 0) {
        this.notification.warning(NOTIFICATION_TITLE.error, `Vui lòng nhập Loại [STT: ${stt}]!`);
        return false;
      }
      if (!reason) {
        this.notification.warning(NOTIFICATION_TITLE.error, `Vui lòng nhập Lý do [STT: ${stt}]!`);
        return false;
      }
      if (id > 0 && !reasonEdit) {
        this.notification.warning(NOTIFICATION_TITLE.error, `Vui lòng nhập Lý do sửa [STT: ${stt}]!`);
        return false;
      }
    }
    return true;
  }

}
