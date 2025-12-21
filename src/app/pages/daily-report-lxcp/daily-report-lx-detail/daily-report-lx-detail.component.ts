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
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    if (this.mode === 'edit' && this.dataInput) {
      const dailyID = typeof this.dataInput === 'number' ? this.dataInput : (this.dataInput?.ID || this.dataInput?.dailyID);
      if (dailyID) {
        this.loadDataForEdit(dailyID);
      }
    } else {
      // Set ngày báo cáo mặc định
      const now = DateTime.local();
      const currentHour = now.hour;
      
      if (currentHour >= 0 && currentHour <= 9) {
        this.formGroup.patchValue({ DateReport: null });
      } else {
        this.formGroup.patchValue({ DateReport: now.toJSDate() });
      }
    }

    // Load film list nếu là PositionID = 7 hoặc 72
    if (this.currentUser?.PositionID === 7 || this.currentUser?.PositionID === 72) {
      this.loadFilmList();
    }
  }

  ngAfterViewInit(): void {}

  private initForm(): void {
    if (this.currentUser?.PositionID === 6) {
      // Form cho Lái xe (PositionID = 6)
      this.formGroup = this.fb.group({
        DateReport: [null, [Validators.required]],
        KmNumber: [null, [Validators.required, Validators.min(0)]],
        TotalLate: [null, [Validators.required, Validators.min(0)]],
        TotalTimeLate: [null, [Validators.required, Validators.min(0)]],
        ReasonLate: ['', [Validators.required]],
        StatusVehicle: [''],
        Propose: [''],
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
      WorkContent: 'Vui lòng nhập nội dung công việc!',
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
      WorkContent: ['', [Validators.required]],
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
      percentage = Math.round((performanceAVG / performanceActual)*100 ) / 100;
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

  loadFilmList(): void {
    this.dailyReportTechService.getFilmList().subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          this.filmList = Array.isArray(response.data) ? response.data : [];
        } else {
          this.filmList = [];
        }
      },
      error: (error: any) => {
        console.error('Error loading film list:', error);
        this.filmList = [];
      }
    });
  }
  

  loadDataForEdit(dailyID: number): void {
    this.dailyReportTechService.getDataByID(dailyID).subscribe({
      next: (response: any) => {
        if (response && response.status === 1 && response.data) {
          const data = Array.isArray(response.data) ? response.data[0] : response.data;
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
    const dateReport = data.DateReport ? DateTime.fromISO(data.DateReport).toJSDate() : null;
    
    if (this.currentUser?.PositionID === 6) {
      // Populate form cho Lái xe (PositionID = 6)
      this.formGroup.patchValue({
        DateReport: dateReport,
        KmNumber: data.KmNumber || 0,
        TotalLate: data.TotalLate || 0,
        TotalTimeLate: data.TotalTimeLate || 0,
        ReasonLate: data.ReasonLate || '',
        StatusVehicle: data.StatusVehicle || '',
        Propose: data.Propose || '',
      });
    } else if (this.currentUser?.PositionID === 7 || this.currentUser?.PositionID === 72) {
      // Populate form cho Cắt phim
      this.formGroup.patchValue({ DateReport: dateReport });
      
      // Clear existing rows và add từ data
      this.filmRows.clear();
      
      if (data.filmDetails && Array.isArray(data.filmDetails)) {
        data.filmDetails.forEach((detail: any) => {
          const row = this.createFilmRowGroup();
          row.patchValue({
            ID: detail.ID || 0,
            FilmManagementDetailId: detail.FilmManagementDetailId,
            WorkContent: detail.WorkContent || '',
            PerformanceAVG: detail.PerformanceAVG || 0,
            Quantity: detail.Quantity || 0,
            TimeActual: detail.TimeActual || 0,
            PerformanceActual: detail.PerformanceActual || 0,
            Percentage: detail.Percentage || 0,
          });
          this.filmRows.push(row);
        });
      } else {
        // Nếu không có data, thêm 1 dòng từ data gốc
        const row = this.createFilmRowGroup();
        row.patchValue({
          ID: data.ID || 0,
          FilmManagementDetailId: data.FilmManagementDetailId,
          WorkContent: data.WorkContent || '',
          PerformanceAVG: data.PerformanceAVG || 0,
          Quantity: data.Quantity || 0,
          TimeActual: data.TimeActual || 0,
          PerformanceActual: data.PerformanceActual || 0,
          Percentage: data.Percentage || 0,
        });
        this.filmRows.push(row);
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

    if (this.formGroup.invalid) {
      this.notification.warning('Thông báo', 'Vui lòng điền đầy đủ các trường bắt buộc!');
      return;
    }

    this.saving = true;
    const dateReport = this.formGroup.get('DateReport')?.value;
    const dateReportStr = DateTime.fromJSDate(dateReport).toFormat('yyyy-MM-dd');
    const userReport = this.currentUser?.ID || 0;

    let reportData: any;

    if (this.currentUser?.PositionID === 6) {
      // Data cho Lái xe (PositionID = 6)
      reportData = {
        ID: this.dataInput?.ID || 0,
        UserReport: userReport,
        DateReport: dateReportStr,
        KmNumber: this.formGroup.get('KmNumber')?.value || 0,
        TotalLate: this.formGroup.get('TotalLate')?.value || 0,
        TotalTimeLate: this.formGroup.get('TotalTimeLate')?.value || 0,
        ReasonLate: this.formGroup.get('ReasonLate')?.value || '',
        StatusVehicle: this.formGroup.get('StatusVehicle')?.value || '',
        Propose: this.formGroup.get('Propose')?.value || '',
      };
    } else if (this.currentUser?.PositionID === 7 || this.currentUser?.PositionID === 72) {
      // Data cho Cắt phim - lấy tất cả các dòng
      const filmDetails = this.filmRows.controls.map((row: any) => ({
        ID: row.get('ID')?.value || 0,
        FilmManagementDetailId: row.get('FilmManagementDetailId')?.value,
        WorkContent: row.get('WorkContent')?.value || '',
        PerformanceAVG: row.get('PerformanceAVG')?.value || 0,
        Quantity: row.get('Quantity')?.value || 0,
        TimeActual: row.get('TimeActual')?.value || 0,
        PerformanceActual: row.get('PerformanceActual')?.value || 0,
        Percentage: row.get('Percentage')?.value || 0,
      }));

      reportData = {
        UserReport: userReport,
        DateReport: dateReportStr,
        filmDetails: filmDetails
      };
    }

    this.dailyReportTechService.saveReportLXCP(reportData).subscribe({
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
        (result) => {},
        (reason) => {}
      ).catch((error) => {
        console.error('Error in modal result:', error);
      });
    } catch (error) {
      console.error('Error in openOverTimeModal:', error);
      this.notification.error('Lỗi', 'Không thể mở modal làm thêm!');
    }
  }
}
