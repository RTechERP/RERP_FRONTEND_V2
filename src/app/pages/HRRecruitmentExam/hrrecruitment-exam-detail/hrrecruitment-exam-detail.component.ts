import {
  Component,
  OnInit,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { HRRecruitmentExamService } from '../hr-recruitment-exam-service/hrrecruitment-exam.service';

@Component({
  selector: 'app-hrrecruitment-exam-detail',
  templateUrl: './hrrecruitment-exam-detail.component.html',
  styleUrl: './hrrecruitment-exam-detail.component.css',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzIconModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzGridModule,
    NzInputNumberModule,
    NzCheckboxModule,
  ],
})
export class HRRecruitmentExamDetailComponent implements OnInit {

  //#region Input từ form cha

  /** ID đề thi - nếu > 0 thì là chế độ sửa, ngược lại là thêm mới */
  @Input() examID: number = 0;

  /** Chế độ: true = sửa, false = thêm mới */
  @Input() isEditMode: boolean = false;

  /** ID phòng ban - nhận từ form cha */
  @Input() departmentID: number = 0;

  //#endregion

  //#region Form

  formGroup!: FormGroup;

  //#endregion

  //#region Danh sách lựa chọn

  examTypeOptions = [
    { value: 1, label: 'Trắc nghiệm' },
    { value: 2, label: 'Tự luận' },
    { value: 3, label: 'Trắc nghiệm & Tự luận' },
  ];

  departmentOptions: any[] = []; // Sẽ lấy từ API

  //#endregion

  //#region Trạng thái

  isSaving: boolean = false;

  //#endregion

  constructor(
    private activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private examService: HRRecruitmentExamService,
    private fb: FormBuilder,
  ) {
    this.createForm();
  }

  //#region Lifecycle

  ngOnInit(): void {
    this.loadDepartments();

    if (this.departmentID > 0) {
      this.formGroup.patchValue({ DepartmentID: this.departmentID }, { emitEvent: false });
    }

    if (this.isEditMode && this.examID > 0) {
      // Chế độ sửa: tải dữ liệu đề thi theo ID
      this.loadExamDetail(this.examID);
    } else {
      // Chế độ thêm mới: đặt giá trị mặc định
      this.resetForm();
    }
  }

  //#endregion

  //#region Khởi tạo form

  private createForm(): void {
    this.formGroup = this.fb.group({
      CodeExam: ['', [Validators.required]],
      NameExam: ['', [Validators.required, Validators.maxLength(500)]],
      ExamType: [1, [Validators.required]],
      DepartmentID: [null, [Validators.required]],
      Goal: [100, [Validators.required, Validators.min(1), Validators.max(100)]],
      TestTime: [60, [Validators.required, Validators.min(1)]],
    });

    // Bắt sự kiện thay đổi loại đề thi để sinh mã tự động
    this.formGroup.get('ExamType')?.valueChanges.subscribe(val => {
      this.onExamTypeChange(val);
    });

    // Bắt sự kiện thay đổi phòng ban để load vị trí tuyển dụng và reset vị trí
    this.formGroup.get('DepartmentID')?.valueChanges.subscribe(val => {
      if (val !== null && val !== undefined) {
        this.onDepartmentChange(val);
      }
    });
  }

  //#endregion

  //#region Tải dữ liệu

  /** Tải danh sách phòng ban */
  loadDepartments(): void {
    this.examService.getDataDepartment().subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.departmentOptions = res.data;
        } else {
          this.departmentOptions = [];
        }
      },
      error: (err) => {
        this.departmentOptions = [];
        console.error('Lỗi khi tải danh sách phòng ban:', err);
      }
    });
  }

  /** Xử lý khi chọn Combobox Phòng ban ở Filter */
  onDepartmentChange(deptId: number): void {
    // Xóa vị trí tuyển dụng cũ
    this.formGroup.patchValue({ RecruitmentSessionID: null });
  }


  /** Tải chi tiết đề thi theo ID để fill vào form */
  loadExamDetail(examId: number): void {
    this.examService.getExamById(examId).subscribe({
      next: (response: any) => {
        if (response.status === 1 && response.data) {
          const model = response.data;
          this.patchExamModel(model);
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Không tìm thấy đề thi!');
        }
      },
      error: (err) => {
        console.error('Lỗi khi tải chi tiết đề thi:', err);
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi tải chi tiết đề thi!');
      },
    });
  }

  private patchExamModel(model: any): void {
    this.formGroup.patchValue({
      CodeExam: model.CodeExam || '',
      NameExam: model.NameExam || '',
      ExamType: model.ExamType || 1,
      DepartmentID: model.DepartmentID || null,
      Goal: model.Goal || 100,
      TestTime: model.TestTime || 60,
    }, { emitEvent: false });
  }

  //#endregion

  //#region Logic tự sinh mã đề thi (setCode)

  /**
   * Tự sinh mã đề thi theo loại đề thi
   * Logic dựa trên WinForms setCode():
   * - Mã có dạng "PrefixCode_LoaiCode" (ví dụ: "DT001_TN")
   * - Nếu ExamType = 1 (Trắc nghiệm) → hậu tố = "TN"
   * - Nếu ExamType = 2 (Tự luận)       → hậu tố = "TL"
   * - Nếu ExamType = 3 (TN & TL)       → hậu tố = "TN_TL"
   */
  setCode(code: string): void {
    const valCode = this.formGroup.get('CodeExam')?.value || 'A_B';
    const examType = this.formGroup.get('ExamType')?.value;

    // Tìm vị trí của dấu '_' đầu tiên
    const firstUnderscoreIndex = valCode.indexOf('_');
    let prefix = valCode;

    // Tách prefix lấy phần trước dấu '_' đầu tiên
    if (firstUnderscoreIndex !== -1) {
      prefix = valCode.substring(0, firstUnderscoreIndex);
    }

    // Nếu có code mới, thay phần prefix
    if (code) {
      prefix = code;
    }

    let suffix = '';
    // Thay hậu tố theo loại đề thi
    if (examType === 3) {
      suffix = 'TN_TL';
    } else if (examType === 2) {
      suffix = 'TL';
    } else if (examType === 1) {
      suffix = 'TN';
    } else {
      // giữ nguyên phần sau nếu có, hoặc mặc định B
      suffix = firstUnderscoreIndex !== -1 ? valCode.substring(firstUnderscoreIndex + 1) : 'B';
    }

    this.formGroup.patchValue({ CodeExam: `${prefix}_${suffix}` });
  }

  //#endregion

  //#region Sự kiện thay đổi loại đề thi

  /** Khi thay đổi loại đề thi → cập nhật mã đề thi */
  onExamTypeChange(value: number): void {
    if (this.formGroup.get('CodeExam')?.value) {
      this.setCode('');
    }
  }

  //#endregion

  //#region Dữ liệu & Lưu

  /** Hiển thị error tip cho toàn bộ form */
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      control.updateValueAndValidity({ onlySelf: true });

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /** Lưu đề thi và đóng dialog */
  onSaveAndClose(): void {
    if (this.formGroup.invalid) {
      this.markFormGroupTouched(this.formGroup);
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng kiểm tra lại thông tin nhập!');
      return;
    }

    this.isSaving = true;
    const data = this.buildSaveData();

    this.examService.saveExam(data).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        if (res.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Lưu đề thi thành công!');
          this.activeModal.close({ success: true, reloadData: true });
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Lưu đề thi thất bại!');
        }
      },
      error: (err) => {
        this.isSaving = false;
        const errorMsg = err?.error?.message || 'Có lỗi xảy ra khi lưu đề thi!';
        this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
        console.error(err);
      },
    });
  }

  /** Lưu đề thi và tiếp tục thêm mới */
  onSaveAndNew(): void {
    if (this.formGroup.invalid) {
      this.markFormGroupTouched(this.formGroup);
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng kiểm tra lại thông tin nhập!');
      return;
    }

    this.isSaving = true;
    const data = this.buildSaveData();

    this.examService.saveExam(data).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        if (res.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Lưu đề thi thành công!');
          // Reset form để thêm mới tiếp
          this.resetForm();
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Lưu đề thi thất bại!');
        }
      },
      error: (err) => {
        this.isSaving = false;
        const errorMsg = err?.error?.message || err?.message || 'Có lỗi xảy ra khi lưu đề thi!';
        this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
        console.error(err);
      },
    });
  }

  /** Tạo object dữ liệu để gửi lên API */
  private buildSaveData(): any {
    // Lấy giá trị bao gồm cả các control đang bị disabled (như CodeExam)
    const formValues = this.formGroup.getRawValue();
    return {
      ID: this.examID || 0,
      CodeExam: formValues.CodeExam.trim(),
      NameExam: formValues.NameExam.trim(),
      ExamType: formValues.ExamType,
      DepartmentID: formValues.DepartmentID,
      Goal: formValues.Goal,
      TestTime: formValues.TestTime,
    };
  }

  private resetForm(): void {
    this.examID = 0;
    this.isEditMode = false;
    this.formGroup.reset({
      ExamType: 1,
      Goal: 100,
      TestTime: 60,
      CodeExam: 'A_B', // Sẽ được cập nhật ở dòng dưới
      DepartmentID: this.departmentID || null,
    }, { emitEvent: false });
    this.setCode('');
  }

  //#endregion

  //#region Đóng dialog

  /** Đóng dialog không lưu */
  onClose(): void {
    this.activeModal.close({ success: false, reloadData: false });
  }

  //#endregion
}
