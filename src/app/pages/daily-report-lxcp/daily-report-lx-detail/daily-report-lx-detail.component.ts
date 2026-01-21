import {
  Component,
  OnInit,
  Input,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { DateTime } from 'luxon';
import { NzModalService } from 'ng-zorro-antd/modal';
import { DailyReportTechService } from '../../DailyReportTech/DailyReportTechService/daily-report-tech.service';
import { OverTimePersonFormComponent } from '../../hrm/over-time/over-time-person/over-time-person-form/over-time-person-form.component';

@Component({
  selector: 'app-daily-report-lx-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzSelectModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    NzCollapseModule,
    NzRadioModule,
    NzToolTipModule,
  ],
  templateUrl: './daily-report-lx-detail.component.html',
  styleUrl: './daily-report-lx-detail.component.css'
})
export class DailyReportLxDetailComponent implements OnInit, AfterViewInit {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() dataInput: any;
  @Input() currentUser: any;

  formGroup!: FormGroup;
  saving: boolean = false;

  // Danh sách film để chọn (cho PositionID = 7)
  filmList: any[] = [];

  // Formatter cho hiển thị phần trăm
  percentFormatter = (value: number): string => `${value}%`;

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private activeModal: NgbActiveModal,
    private modalService: NzModalService,
    private dailyReportTechService: DailyReportTechService,
    private ngbModal: NgbModal,
  ) { }

  ngOnInit(): void {
    this.initForm();

    // Load film list trước nếu là PositionID = 7 hoặc 72 (cần cho dropdown)
    if (this.currentUser?.PositionID === 7 || this.currentUser?.PositionID === 72) {
      this.loadFilmList(() => {
        // Sau khi film list load xong, mới load data để edit
        if (this.mode === 'edit' && this.dataInput) {
          const dailyID = typeof this.dataInput === 'number' ? this.dataInput : (this.dataInput?.ID || this.dataInput?.dailyID);
          if (dailyID) {
            this.loadDataForEdit(dailyID);
          }
        } else {
          // Set ngày báo cáo mặc định cho chế độ add
          this.setDefaultDateReport();
        }
      });
    } else {
      // Nếu không phải cắt phim, load data ngay
      if (this.mode === 'edit' && this.dataInput) {
        const dailyID = typeof this.dataInput === 'number' ? this.dataInput : (this.dataInput?.ID || this.dataInput?.dailyID);
        if (dailyID) {
          this.loadDataForEdit(dailyID);
        }
      } else {
        // Set ngày báo cáo mặc định cho chế độ add
        this.setDefaultDateReport();
      }
    }
  }

  private setDefaultDateReport(): void {
    const now = DateTime.local();
    const currentHour = now.hour;

    if (currentHour >= 0 && currentHour <= 9) {
      this.formGroup.patchValue({ DateReport: null });
    } else {
      this.formGroup.patchValue({ DateReport: now.toJSDate() });
    }
  }

  ngAfterViewInit(): void { }

  private initForm(): void {
    if (this.currentUser?.PositionID === 6) {
      // Form cho Lái xe (PositionID = 6)
      this.formGroup = this.fb.group({
        DateReport: [null, [Validators.required]],
        KmNumber: [null, [Validators.required, Validators.min(0)]],
        TotalLate: [null, [Validators.required, Validators.min(0)]],
        TotalTimeLate: [null, [Validators.required, Validators.min(0)]],
        ReasonLate: [''], // Không bắt buộc mặc định, sẽ validate động
        StatusVehicle: [''],
        Propose: [''],
      });

      // Thêm listener để update validation cho ReasonLate khi TotalLate hoặc TotalTimeLate thay đổi
      this.formGroup.get('TotalLate')?.valueChanges.subscribe(() => {
        this.updateReasonLateValidation();
      });
      this.formGroup.get('TotalTimeLate')?.valueChanges.subscribe(() => {
        this.updateReasonLateValidation();
      });
    } else {
      // Form cho Cắt phim (PositionID = 7 hoặc 72)
      this.formGroup = this.fb.group({
        DateReport: [null, [Validators.required]],
        filmRows: this.fb.array([])
      });
      // Thêm 1 dòng mặc định
      this.addFilmRow();
    }
  }

  // Helper method để lấy trạng thái validate của control
  getValidateStatus(controlName: string): string {
    const control = this.formGroup.get(controlName);
    if (control && control.invalid && (control.dirty || control.touched)) {
      return 'error';
    }
    return '';
  }

  // Helper method để lấy trạng thái validate của control trong filmRows
  getFilmRowValidateStatus(index: number, controlName: string): string {
    const row = this.filmRows.at(index);
    const control = row?.get(controlName);
    if (control && control.invalid && (control.dirty || control.touched)) {
      return 'error';
    }
    return '';
  }

  // Cập nhật validation cho ReasonLate dựa trên TotalLate và TotalTimeLate
  private updateReasonLateValidation(): void {
    const totalLate = this.formGroup.get('TotalLate')?.value || 0;
    const totalTimeLate = this.formGroup.get('TotalTimeLate')?.value || 0;
    const reasonLateControl = this.formGroup.get('ReasonLate');

    if ((totalLate > 0 || totalTimeLate > 0) && reasonLateControl) {
      // Nếu có số cuốc muộn hoặc số phút muộn > 0, thì lý do muộn là bắt buộc
      reasonLateControl.setValidators([Validators.required]);
    } else {
      // Nếu không có muộn, thì không bắt buộc
      reasonLateControl?.clearValidators();
    }
    reasonLateControl?.updateValueAndValidity({ emitEvent: false });
  }

  // Helper method để lấy error message
  getErrorTip(controlName: string): string {
    const control = this.formGroup.get(controlName);
    if (control?.hasError('required')) {
      return this.getRequiredMessage(controlName);
    }
    if (control?.hasError('min')) {
      return 'Giá trị phải lớn hơn hoặc bằng 0!';
    }
    return '';
  }

  // Helper method để lấy error message cho filmRows
  getFilmRowErrorTip(index: number, controlName: string): string {
    const row = this.filmRows.at(index);
    const control = row?.get(controlName);
    if (control?.hasError('required')) {
      return this.getRequiredMessage(controlName);
    }
    if (control?.hasError('min')) {
      return 'Giá trị phải lớn hơn hoặc bằng 0!';
    }
    return '';
  }

  private getRequiredMessage(controlName: string): string {
    const messages: { [key: string]: string } = {
      DateReport: 'Vui lòng chọn ngày báo cáo!',
      KmNumber: 'Vui lòng nhập số Km!',
      TotalLate: 'Vui lòng nhập số cuốc xe muộn!',
      TotalTimeLate: 'Vui lòng nhập tổng số phút chậm!',
      ReasonLate: 'Vui lòng nhập lý do muộn!',
      FirmManagementDetailId: 'Vui lòng chọn nội dung công việc!',
      //WorkContent: 'Vui lòng nhập nội dung công việc!',
      Quantity: 'Vui lòng nhập số lượng!',
      TimeActual: 'Vui lòng nhập thời gian!',
    };
    return messages[controlName] || 'Trường này là bắt buộc!';
  }

  // Getter cho filmRows FormArray
  get filmRows(): FormArray {
    return this.formGroup.get('filmRows') as FormArray;
  }

  // Tạo FormGroup cho 1 dòng film
  createFilmRowGroup(): FormGroup {
    return this.fb.group({
      ID: [0],
      FilmManagementDetailId: [null], // Không bắt buộc vì đã comment trong HTML
      // WorkContent: ['', [Validators.required]],
      PerformanceAVG: [{ value: 0, disabled: true }],
      Quantity: [null, [Validators.required, Validators.min(0)]],
      TimeActual: [null, [Validators.required, Validators.min(0)]],
      PerformanceActual: [{ value: 0, disabled: true }],
      Percentage: [{ value: 0, disabled: true }],
    });
  }

  // Thêm dòng film
  addFilmRow(): void {
    this.filmRows.push(this.createFilmRowGroup());
  }

  // Xóa dòng film
  removeFilmRow(index: number): void {
    if (this.filmRows.length > 1) {
      this.filmRows.removeAt(index);
    } else {
      this.notification.warning('Thông báo', 'Phải có ít nhất 1 dòng công việc!');
    }
  }

  // Tính toán năng suất thực tế và tỷ lệ khi thay đổi số lượng hoặc thời gian
  calculatePerformance(index: number): void {
    const row = this.filmRows.at(index);
    const quantity = row.get('Quantity')?.value || 0;
    const timeActual = row.get('TimeActual')?.value || 0;
    const performanceAVG = row.get('PerformanceAVG')?.value || 0;

    // Năng suất thực tế = Thời gian thực hiện / Số lượng
    let performanceActual = 0;
    if (quantity > 0) {
      performanceActual = Math.round((timeActual / quantity) * 100) / 100;
    }
    row.get('PerformanceActual')?.setValue(performanceActual);

    // Tỷ lệ = Năng suất trung bình / Năng suất thực tế * 100
    let percentage = 0;
    if (performanceActual > 0 && performanceAVG > 0) {
      percentage = Math.round((performanceAVG / performanceActual) * 100) / 100;
    }
    row.get('Percentage')?.setValue(percentage);
  }

  // Khi chọn film, load năng suất trung bình
  onFilmChange(index: number, filmId: number): void {
    console.log('onFilmChange', index, filmId);
    const selectedFilm = this.filmList.find(f => f.ID === filmId);
    if (selectedFilm) {
      const row = this.filmRows.at(index);
      row.get('PerformanceAVG')?.setValue(selectedFilm.PerformanceAVG || 0);
      this.calculatePerformance(index);
    }
  }

  loadFilmList(callback?: () => void): void {
    this.dailyReportTechService.getFilmList().subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          this.filmList = Array.isArray(response.data) ? response.data : [];
        } else {
          this.filmList = [];
        }
        if (callback) {
          callback();
        }
      },
      error: (error: any) => {
        console.error('Error loading film list:', error);
        this.filmList = [];
        if (callback) {
          callback();
        }
      }
    });
  }


  loadDataForEdit(dailyID: number): void {
    this.dailyReportTechService.getDailyReportHRByID(dailyID).subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          const data = response.data;
          this.populateForm(data);
        } else {
          this.notification.error('Lỗi', response?.message || 'Không thể tải dữ liệu báo cáo!');
        }
      },
      error: (error: any) => {
        console.error('Error loading daily report data:', error);
        this.notification.error('Lỗi', error?.error?.message || error?.message || 'Đã xảy ra lỗi khi tải dữ liệu!');
      }
    });
  }

  private populateForm(data: any): void {
    // Xử lý nếu data là array (lấy phần tử đầu tiên)
    const reportData = Array.isArray(data) ? data[0] : data;

    if (!reportData) {
      this.notification.error('Lỗi', 'Dữ liệu báo cáo không hợp lệ!');
      return;
    }

    const dateReport = reportData.DateReport ? DateTime.fromISO(reportData.DateReport).toJSDate() : null;

    if (this.currentUser?.PositionID === 6) {
      // Populate form cho Lái xe (PositionID = 6)
      this.formGroup.patchValue({
        DateReport: dateReport,
        KmNumber: reportData.KmNumber || 0,
        TotalLate: reportData.TotalLate || 0,
        TotalTimeLate: reportData.TotalTimeLate || 0,
        ReasonLate: reportData.ReasonLate || '',
        StatusVehicle: reportData.StatusVehicle || '',
        Propose: reportData.Propose || '',
      });

      // Lưu ID để dùng khi save
      if (reportData.ID) {
        this.dataInput = { ID: reportData.ID };
      }

      // Cập nhật validation cho ReasonLate sau khi populate
      this.updateReasonLateValidation();
    } else if (this.currentUser?.PositionID === 7 || this.currentUser?.PositionID === 72) {
      // Populate form cho Cắt phim
      this.formGroup.patchValue({ DateReport: dateReport });

      // Clear existing rows và add từ data
      this.filmRows.clear();

      // Kiểm tra nếu có filmDetails (nhiều dòng)
      if (reportData.filmDetails && Array.isArray(reportData.filmDetails) && reportData.filmDetails.length > 0) {
        reportData.filmDetails.forEach((detail: any) => {
          const row = this.createFilmRowGroup();
          row.patchValue({
            ID: detail.ID || 0,
            FilmManagementDetailId: detail.FilmManagementDetailID || detail.FilmManagementDetailId,
            PerformanceAVG: detail.PerformanceAVG || 0,
            Quantity: detail.Quantity || 0,
            TimeActual: detail.TimeActual || 0,
            PerformanceActual: detail.PerformanceActual || 0,
            Percentage: detail.Percentage || 0,
          });
          this.filmRows.push(row);
        });
      } else if (reportData.FilmManagementDetailID || reportData.FilmManagementDetailId) {
        // Nếu chỉ có 1 dòng trong data gốc
        const row = this.createFilmRowGroup();
        row.patchValue({
          ID: reportData.ID || 0,
          FilmManagementDetailId: reportData.FilmManagementDetailID || reportData.FilmManagementDetailId,
          PerformanceAVG: reportData.PerformanceAVG || 0,
          Quantity: reportData.Quantity || 0,
          TimeActual: reportData.TimeActual || 0,
          PerformanceActual: reportData.PerformanceActual || 0,
          Percentage: reportData.Percentage || 0,
        });
        this.filmRows.push(row);
      } else {
        // Nếu không có dữ liệu, thêm 1 dòng trống
        this.addFilmRow();
      }
    }
  }

  disabledDate = (current: Date): boolean => {
    const today = DateTime.local().startOf('day');
    const oneDayAgo = today.minus({ days: 1 });
    const currentDate = DateTime.fromJSDate(current).startOf('day');
    return currentDate < oneDayAgo;
  };

  saveDailyReport(): void {
    if (this.saving) return;

    // Mark all fields as touched
    this.formGroup.markAllAsTouched();
    if (this.filmRows) {
      this.filmRows.controls.forEach(row => {
        (row as FormGroup).markAllAsTouched();
      });
    }

    // Kiểm tra validation cho ReasonLate nếu có muộn (cho Lái xe)
    if (this.currentUser?.PositionID === 6) {
      const totalLate = this.formGroup.get('TotalLate')?.value || 0;
      const totalTimeLate = this.formGroup.get('TotalTimeLate')?.value || 0;
      const reasonLate = this.formGroup.get('ReasonLate')?.value || '';

      if ((totalLate > 0 || totalTimeLate > 0) && !reasonLate.trim()) {
        this.formGroup.get('ReasonLate')?.setErrors({ required: true });
        this.formGroup.get('ReasonLate')?.markAsTouched();
        this.notification.warning('Thông báo', 'Vui lòng nhập lý do muộn khi có số cuốc xe muộn hoặc số phút muộn!');
        return;
      }
    }

    if (this.formGroup.invalid) {
      this.notification.warning('Thông báo', 'Vui lòng điền đầy đủ các trường bắt buộc!');
      return;
    }

    // Kiểm tra trùng lặp FilmManagementDetailId cho trường hợp Cắt phim
    if (this.currentUser?.PositionID === 7 || this.currentUser?.PositionID === 72) {
      const filmDetailIds: number[] = [];
      let hasDuplicate = false;
      let duplicateIndex = -1;

      this.filmRows.controls.forEach((row: any, index: number) => {
        const filmManagementDetailId = row.get('FilmManagementDetailId')?.value;
        if (filmManagementDetailId && filmManagementDetailId > 0) {
          if (filmDetailIds.includes(filmManagementDetailId)) {
            hasDuplicate = true;
            duplicateIndex = index;
            return;
          } else {
            filmDetailIds.push(filmManagementDetailId);
          }
        }
      });

      if (hasDuplicate) {
        // Set error cho dòng bị trùng
        if (duplicateIndex >= 0) {
          const duplicateRow = this.filmRows.at(duplicateIndex);
          duplicateRow.get('FilmManagementDetailId')?.setErrors({ duplicate: true });
          duplicateRow.get('FilmManagementDetailId')?.markAsTouched();
        }
        this.notification.warning('Thông báo', '2 Nội dung công việc không thể trùng nhau!');
        return;
      }
    }

    this.saving = true;
    const dateReport = this.formGroup.get('DateReport')?.value;
    const dateReportStr = typeof dateReport === 'string'
      ? dateReport
      : DateTime.fromJSDate(dateReport).toFormat('yyyy-MM-dd');
    const employeeID = this.currentUser?.EmployeeID || 0;

    let reportList: any[] = [];

    if (this.currentUser?.PositionID === 6) {
      // Data cho Lái xe (PositionID = 6) - tạo 1 object trong list
      const driverReport = {
        ID: this.dataInput?.ID || 0,
        EmployeeID: employeeID,
        DateReport: dateReportStr,
        FilmManagementDetailID: null,
        Quantity: null,
        TimeActual: 0,
        PerformanceActual: null,
        Percentage: null,
        KmNumber: this.formGroup.get('KmNumber')?.value || 0,
        TotalLate: this.formGroup.get('TotalLate')?.value || 0,
        TotalTimeLate: this.formGroup.get('TotalTimeLate')?.value || 0,
        ReasonLate: this.formGroup.get('ReasonLate')?.value || '',
        StatusVehicle: this.formGroup.get('StatusVehicle')?.value || '',
        Propose: this.formGroup.get('Propose')?.value || '',
        IsDeleted: false,
      };
      reportList.push(driverReport);
    } else if (this.currentUser?.PositionID === 7 || this.currentUser?.PositionID === 72) {
      // Data cho Cắt phim - mỗi dòng thành 1 object trong list
      reportList = this.filmRows.controls.map((row: any) => {
        const filmManagementDetailId = row.get('FilmManagementDetailId')?.value;
        const quantity = row.get('Quantity')?.value || 0;
        const timeActual = row.get('TimeActual')?.value || 0;

        return {
          ID: row.get('ID')?.value || 0,
          EmployeeID: employeeID,
          DateReport: dateReportStr,
          FilmManagementDetailID: filmManagementDetailId || null,
          Quantity: quantity || null,
          TimeActual: timeActual || 0,
          // PerformanceActual và Percentage sẽ được tính ở backend
          PerformanceActual: null,
          Percentage: null,
          // Các field cho Lái xe = null
          KmNumber: null,
          TotalLate: null,
          TotalTimeLate: null,
          ReasonLate: null,
          StatusVehicle: null,
          Propose: null,
          IsDeleted: false,
        };
      });
    }

    // Gọi API với list DailyReportHR
    this.dailyReportTechService.saveReportHr(reportList).subscribe({
      next: (response: any) => {
        this.saving = false;
        if (response && response.status === 1) {
          this.notification.success('Thông báo', response.message || 'Báo cáo đã được lưu thành công!');
          this.close(true);
        } else {
          this.notification.error('Thông báo', response?.message || 'Lưu báo cáo thất bại!');
        }
      },
      error: (error: any) => {
        this.saving = false;
        const errorMessage = error?.error?.message || error?.message || 'Có lỗi xảy ra khi lưu báo cáo!';
        this.notification.error('Thông báo', errorMessage);
      }
    });
  }

  deleteDailyReport(): void {
    if (this.saving) return;

    // Kiểm tra có ID để xóa không
    let reportId = 0;
    if (this.mode === 'edit' && this.dataInput) {
      reportId = typeof this.dataInput === 'number' ? this.dataInput : (this.dataInput?.ID || this.dataInput?.dailyID || 0);
    }

    if (!reportId || reportId === 0) {
      this.notification.warning('Thông báo', 'Không tìm thấy báo cáo để xóa!');
      return;
    }

    this.modalService.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa báo cáo này không?',
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.saving = true;
        const employeeID = this.currentUser?.EmployeeID || 0;

        // Tạo object với IsDeleted = true
        const deleteReport = {
          ID: reportId,
          EmployeeID: employeeID,
          IsDeleted: true,
        };

        // Gọi API save với IsDeleted = true
        this.dailyReportTechService.saveReportHr([deleteReport]).subscribe({
          next: (response: any) => {
            this.saving = false;
            if (response && response.status === 1) {
              this.notification.success('Thông báo', response.message || 'Xóa báo cáo thành công!');
              this.close(true);
            } else {
              this.notification.error('Thông báo', response?.message || 'Xóa báo cáo thất bại!');
            }
          },
          error: (error: any) => {
            this.saving = false;
            const errorMessage = error?.error?.message || error?.message || 'Có lỗi xảy ra khi xóa báo cáo!';
            this.notification.error('Thông báo', errorMessage);
          }
        });
      }
    });
  }

  close(success: boolean = false): void {
    this.activeModal.close(success);
  }

  openOverTimeModal(): void {
    try {
      const modalRef = this.ngbModal.open(OverTimePersonFormComponent, {
        centered: true,
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
        windowClass: 'overtime-modal-custom'
      });

      if (!modalRef) {
        this.notification.error('Lỗi', 'Không thể mở modal làm thêm!');
        return;
      }

      if (modalRef.componentInstance) {
        modalRef.componentInstance.data = null;
        modalRef.componentInstance.isEditMode = false;
      }

      modalRef.result.then(
        (result) => { },
        (reason) => { }
      ).catch((error) => {
        console.error('Error in modal result:', error);
      });
    } catch (error) {
      console.error('Error in openOverTimeModal:', error);
      this.notification.error('Lỗi', 'Không thể mở modal làm thêm!');
    }
  }
}
