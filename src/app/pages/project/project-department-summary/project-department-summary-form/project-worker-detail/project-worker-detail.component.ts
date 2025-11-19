import { Component, OnInit, AfterViewInit, Input, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ChangeDetectorRef } from '@angular/core';
import { NzFormModule } from 'ng-zorro-antd/form';
import { ProjectWorkerService } from '../project-woker/project-worker-service/project-worker.service';
import { Tabulator } from 'tabulator-tables';

@Component({
  selector: 'app-project-worker-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzSelectModule,
    NzGridModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzButtonModule,
    NzFormModule,
  ],
  templateUrl: './project-worker-detail.component.html',
  styleUrl: './project-worker-detail.component.css',
})
export class ProjectWorkerDetailComponent implements OnInit, AfterViewInit {
  @Input() projectID: number = 0;
  @Input() ProjectWorkerVersionID: number = 0;
  @Input() ID: number = 0; // ID của worker khi edit
  @Input() workerData: any = null; // Dữ liệu worker khi edit
  @Input() parentList: any[] = []; // Danh sách các node cha có thể chọn (để thêm con)
  
  form!: FormGroup;
  isEditMode: boolean = false;
  parentOptions: any[] = []; // Danh sách parent để chọn (chỉ node cha, không có con)

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private projectWorkerService: ProjectWorkerService,
    private notification: NzNotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isEditMode = this.ID > 0;
    
    this.form = this.fb.group({
      TT: ['', [Validators.required, this.trimRequiredValidator]],
      WorkContent: ['', [Validators.required, this.trimRequiredValidator]],
      AmountPeople: [0, [Validators.required, Validators.min(0)]],
      NumberOfDay: [0, [Validators.required, Validators.min(0)]],
      Price: [0, [Validators.required, Validators.min(0)]],
      TotalWorkforce: [{ value: 0, disabled: true }], // Tính tự động, không cho nhập
      TotalPrice: [{ value: 0, disabled: true }], // Tính tự động, không cho nhập
      ParentID: [0], // 0 = không có parent (node gốc)
    });

    // Subscribe để tính toán tự động khi thay đổi
    this.form.get('AmountPeople')?.valueChanges.subscribe(() => this.calculateTotals());
    this.form.get('NumberOfDay')?.valueChanges.subscribe(() => this.calculateTotals());
    this.form.get('Price')?.valueChanges.subscribe(() => this.calculateTotals());

    // Nếu là edit mode, load dữ liệu worker
    if (this.isEditMode && this.ID > 0) {
      this.fillFormData();
    } else {
      // Nếu là thêm mới, load danh sách parent để chọn
      this.loadParentOptions();
    }
  }

  ngAfterViewInit(): void {
    // Fill dữ liệu vào form nếu là edit mode và có workerData
    if (this.isEditMode && this.workerData) {
      this.fillFormData();
    }
  }

  // Custom validator để kiểm tra string không chỉ có khoảng trắng
  trimRequiredValidator(control: any) {
    if (!control.value || typeof control.value !== 'string') {
      return { required: true };
    }
    if (control.value.trim().length === 0) {
      return { required: true };
    }
    return null;
  }
  fillFormData(): void {
    if (!this.workerData) return;

    const data = this.workerData;

    this.form.patchValue({
      TT: data.TT || '',
      WorkContent: data.WorkContent || '',
      AmountPeople: data.AmountPeople || 0,
      NumberOfDay: data.NumberOfDay || 0,
      Price: data.Price || 0,
      ParentID: data.ParentID || 0,
    });

    // Tính toán lại sau khi fill data
    this.calculateTotals();

    // Disable ParentID khi edit (không cho đổi parent khi sửa)
    this.form.get('ParentID')?.disable();
  }

  // Tính toán tự động Tổng nhân công và Thành tiền
  calculateTotals(): void {
    const amountPeople = Number(this.form.get('AmountPeople')?.value) || 0;
    const numberOfDay = Number(this.form.get('NumberOfDay')?.value) || 0;
    const price = Number(this.form.get('Price')?.value) || 0;

    // Tổng nhân công = Số người × Số ngày
    const totalWorkforce = amountPeople * numberOfDay;
    
    // Thành tiền = Tổng nhân công × Đơn giá
    const totalPrice = totalWorkforce * price;

    // Cập nhật giá trị (dùng patchValue để không trigger valueChanges)
    this.form.patchValue({
      TotalWorkforce: totalWorkforce,
      TotalPrice: totalPrice
    }, { emitEvent: false });
  }

  loadParentOptions(): void {
    // Lọc danh sách parent: chỉ lấy các node cha (có _children hoặc không có con)
    // Từ parentList, lọc ra các node có thể làm parent (chỉ node cha, không phải node lá)
    if (this.parentList && this.parentList.length > 0) {
      // TODO: Cần logic để lọc các node cha từ tree data
      // Tạm thời dùng parentList trực tiếp
      this.parentOptions = this.parentList.map((item: any) => ({
        value: item.ID,
        label: `${item.TT} - ${item.WorkContent || ''}`,
        hasChildren: item._children && item._children.length > 0
      }));
    }
  }

  onSave(): void {
    if (this.form.invalid) {
      // Đánh dấu tất cả các field là touched để hiển thị lỗi
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      this.notification.warning('Cảnh báo', 'Vui lòng điền đầy đủ thông tin bắt buộc!');
      return;
    }

    const formValue = this.form.getRawValue(); // getRawValue() để lấy cả giá trị disabled
    
    // Tính toán lại để đảm bảo chính xác
    const amountPeople = Number(formValue.AmountPeople) || 0;
    const numberOfDay = Number(formValue.NumberOfDay) || 0;
    const price = Number(formValue.Price) || 0;
    const totalWorkforce = amountPeople * numberOfDay;
    const totalPrice = totalWorkforce * price;
    
    // Chuẩn bị payload theo model ProjectWorker từ API
    const payload: any = {
      ID: this.isEditMode ? this.ID : 0,
      ProjectID: this.projectID,
      ProjectWorkerVersionID: this.ProjectWorkerVersionID,
      TT: formValue.TT.trim(),
      WorkContent: formValue.WorkContent.trim(),
      AmountPeople: amountPeople,
      NumberOfDay: numberOfDay,
      Price: price,
      TotalWorkforce: totalWorkforce,
      TotalPrice: totalPrice,
      IsDeleted: false, // Đảm bảo có trường IsDeleted khi thêm/sửa
    };

    // Theo API: Khi thêm mới (ID = 0), API sẽ tự động tìm ParentID từ TT
    // Khi sửa (ID > 0), giữ nguyên ParentID hiện tại
    if (this.isEditMode && this.ID > 0) {
      // Khi sửa, giữ nguyên ParentID từ dữ liệu gốc
      payload.ParentID = formValue.ParentID || 0;
    } else {
      // Khi thêm mới, có thể truyền ParentID nếu user chọn, hoặc để null để API tự tìm từ TT
      // Nếu user chọn parent từ dropdown, dùng giá trị đó
      // Nếu không chọn (0), API sẽ tự tìm ParentID từ TT
      payload.ParentID = formValue.ParentID && formValue.ParentID > 0 ? formValue.ParentID : null;
    }

    // Gọi API để save worker - API nhận List<ProjectWorker>, nên gửi dạng array
    const payloadArray = [payload];
    console.log('Save payload:', JSON.stringify(payloadArray, null, 2));
    this.projectWorkerService.saveWorker(payloadArray).subscribe({
      next: (response: any) => {
        // API trả về: status = 1 (success), status = 2 (TT đã tồn tại)
        if (response.status === 1) {
          this.notification.success('Thành công', response.message || 'Lưu nhân công thành công!');
          this.activeModal.close({ success: true, data: response.data });
        } else if (response.status === 2) {
          // TT đã tồn tại
          this.notification.error('Lỗi', response.message || 'TT đã tồn tại, vui lòng kiểm tra lại!');
        } else {
          this.notification.error('Lỗi', response.message || 'Không thể lưu nhân công');
        }
      },
      error: (error: any) => {
        console.error('Error saving worker:', error);
        const errorMessage = error?.error?.message || error?.message || 'Không thể lưu nhân công';
        this.notification.error('Lỗi', errorMessage);
      }
    });
  }

  closeModal(): void {
    this.activeModal.dismiss('cancel');
  }

  // Formatter và parser cho input number
  formatCurrency = (value: number): string => {
    return value ? value.toLocaleString('vi-VN') : '';
  }

  parseCurrency = (value: string): number => {
    const cleaned = value.replace(/\s/g, '').replace(/\./g, '');
    return Number(cleaned) || 0;
  }
}
