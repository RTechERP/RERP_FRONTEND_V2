import {
  Component,
  OnInit,
  Input,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { DateTime } from 'luxon';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { DailyReportTechService } from '../DailyReportTechService/daily-report-tech.service';

@Component({
  selector: 'app-daily-report-excel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzDatePickerModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzFormModule,
    NzSelectModule,
  ],
  templateUrl: './daily-report-excel.component.html',
  styleUrl: './daily-report-excel.component.css'
})
export class DailyReportExcelComponent implements OnInit, AfterViewInit {
  @Input() teams: any[] = []; // Nhận dữ liệu teams từ parent component

  form!: FormGroup;
  exporting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    public activeModal: NgbActiveModal,
    private dailyReportTechService: DailyReportTechService,
  ) {};
  ngOnInit(): void {
    // Set giá trị mặc định cho form
    const today = DateTime.local().toJSDate();
    const yesterday = DateTime.local().minus({ days: 1 }).toJSDate();

    this.form = this.fb.group({
      dateStart: [yesterday, [Validators.required]],
      dateEnd: [today, [Validators.required]],
      teamId: [[], [Validators.required, this.arrayNotEmptyValidator]],
    });
  }

  // Validator để kiểm tra mảng không rỗng
  arrayNotEmptyValidator = (control: any) => {
    const value = control?.value;
    if (!value || !Array.isArray(value) || value.length === 0) {
      return { required: true };
    }
    return null;
  };

  ngAfterViewInit(): void {}

  closeModal(): void {
    this.activeModal.dismiss();
  }

  exportExcel(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin!');
      return;
    }

    const formValue = this.form.getRawValue();
    
    // Validate ngày
    if (formValue.dateStart && formValue.dateEnd) {
      const startDate = DateTime.fromJSDate(formValue.dateStart);
      const endDate = DateTime.fromJSDate(formValue.dateEnd);
      
      if (endDate < startDate) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Đến ngày phải lớn hơn hoặc bằng Từ ngày!');
        return;
      }
    }

    // Validate team IDs
    if (!formValue.teamId || !Array.isArray(formValue.teamId) || formValue.teamId.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một team!');
      return;
    }

    this.exporting = true;

    // Format team IDs thành string phân cách bằng ";"
    const teamIds = formValue.teamId as number[];
    const teamIdString = teamIds.join(';');

    // Lấy tên các team đã chọn để tạo tên file
    const selectedTeams = this.teams.filter(team => teamIds.includes(team.ID));
    const teamNames = selectedTeams.map(team => team.Name).join('_');
    const teamName = teamNames || 'All';

    // Format dates
    const dateStart = formValue.dateStart instanceof Date 
      ? formValue.dateStart 
      : DateTime.fromJSDate(formValue.dateStart).toJSDate();
    const dateEnd = formValue.dateEnd instanceof Date 
      ? formValue.dateEnd 
      : DateTime.fromJSDate(formValue.dateEnd).toJSDate();

    // Gọi API xuất Excel
    this.dailyReportTechService.exportToExcel({
      DateStart: dateStart,
      DateEnd: dateEnd,
      TeamID: teamIdString,
      TeamName: teamName
    }).subscribe({
      next: (blob: Blob) => {
        this.exporting = false;

        // Kiểm tra xem có phải là blob hợp lệ không
        if (blob && blob.size > 0) {
          // Tạo tên file từ response header hoặc tạo mặc định
          const dateStartStr = DateTime.fromJSDate(dateStart).toFormat('ddMMyyyy');
          const dateEndStr = DateTime.fromJSDate(dateEnd).toFormat('ddMMyyyy');
          const fileName = `DanhSachBaoCaoCongViec_${teamName}_${dateStartStr}_${dateEndStr}.xlsx`;

          // Tạo URL từ blob và download
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          this.notification.success(NOTIFICATION_TITLE.success, 'Xuất Excel thành công!');
          this.activeModal.close({ success: true, data: formValue });
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, 'File tải về không hợp lệ!');
        }
      },
      error: (error: any) => {
        this.exporting = false;
        
        // Xử lý lỗi nếu response là blob (có thể server trả về lỗi dạng blob)
        if (error.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorText = JSON.parse(reader.result as string);
              this.notification.error(
                NOTIFICATION_TITLE.error, 
                errorText.message || errorText.Message || 'Có lỗi xảy ra khi xuất Excel!'
              );
            } catch {
              this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi xuất Excel!');
            }
          };
          reader.readAsText(error.error);
        } else {
          const errorMsg = error?.error?.message || error?.message || 'Có lỗi xảy ra khi xuất Excel!';
          this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
        }
        console.error('Error exporting Excel:', error);
      }
    });
  }
}
