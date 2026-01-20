import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { KpiPositionEmployeeService } from '../kpi-position-employee-service/kpi-position-employee.service';
import { KpiPositionTypeDetailComponent } from '../kpi-position-type-detail/kpi-position-type-detail.component';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
  selector: 'app-kpi-position-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzInputNumberModule,
    NzIconModule,
    NzModalModule
  ],
  templateUrl: './kpi-position-detail.component.html',
  styleUrl: './kpi-position-detail.component.css'
})
export class KpiPositionDetailComponent implements OnInit {
  @Input() id: number = 0;
  @Input() isEditMode: boolean = false;
  @Input() departmentId: number = 0;
  @Input() kpiSessionId: number = 0;
  @Input() kpiPosition: any = {};
  @Output() onSaved = new EventEmitter<any>();

  // Model data
  model: any = {};

  // Dropdown data 
  typePositions: any[] = [
    { ID: 1, Name: 'Kỹ thuật, Pro' },
    { ID: 3, Name: 'Senior' },
    { ID: 4, Name: 'Phó phòng' },
    { ID: 2, Name: 'Admin' }
  ];

  kpiSessions: any[] = [];
  groupedKpiSessions: { key: string; value: any[] }[] = [];
  positionTypes: any[] = [];

  // Validation errors
  errors: any = {};

  constructor(
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private service: KpiPositionEmployeeService
  ) { }

  ngOnInit(): void {
    this.initModel();
    this.loadKpiSessions();
  }

  /**
   * Khởi tạo model với data từ kpiPosition input
   */
  private initModel(): void {
    this.model = {
      ID: this.kpiPosition?.ID || 0,
      PositionCode: this.kpiPosition?.PositionCode || '',
      PositionName: this.kpiPosition?.PositionName || '',
      STT: this.kpiPosition?.STT || 0,
      TypePosition: this.kpiPosition?.TypePosition || null,
      KPISessionID: this.kpiPosition?.KPISessionID || this.kpiSessionId || null,
      KPIPositionTypeID: this.kpiPosition?.KPIPositionTypeID || null
    };
  }

  /**
   * Load danh sách kỳ đánh giá theo departmentId
   */
  loadKpiSessions(): void {
    this.service.getKPISession(this.departmentId).subscribe({
      next: (response: any) => {
        if (response?.status === 1) {
          this.kpiSessions = response.data;
          this.groupKpiSessions();

          // Load position types if kpiSessionId is already set
          if (this.model.KPISessionID) {
            this.loadPositionTypes();
          }
        }
      },
      error: (error: any) => {
        console.error('Error loading KPI sessions:', error);
      }
    });
  }

  private groupKpiSessions(): void {
    const grouped = new Map<string, any[]>();
    this.kpiSessions.forEach(session => {
      const year = session.YearEvaluation?.toString() || 'Khác';
      if (!grouped.has(year)) {
        grouped.set(year, []);
      }
      grouped.get(year)!.push(session);
    });
    // Sort by year descending
    this.groupedKpiSessions = Array.from(grouped, ([key, value]) => ({ key, value }))
      .sort((a, b) => parseInt(b.key) - parseInt(a.key));
  }

  /**
   * Load danh sách loại chuyên môn theo KPISessionID
   */
  loadPositionTypes(): void {
    if (!this.model.KPISessionID) {
      this.positionTypes = [];
      return;
    }

    this.service.getPositionType(this.model.KPISessionID).subscribe({
      next: (response: any) => {
        if (response?.status === 1) {
          this.positionTypes = response.data;
        }
      },
      error: (error: any) => {
        console.error('Error loading position types:', error);
      }
    });
  }

  /**
   * Khi thay đổi kỳ đánh giá -> load lại loại chuyên môn
   */
  onKpiSessionChange(): void {
    this.errors.kpiSessionId = '';
    this.model.KPIPositionTypeID = null;
    this.loadPositionTypes();
  }

  /**
   * Khi thay đổi loại chuyên môn -> tự động fill mã và tên chức vụ
   */
  onPositionTypeChange(): void {
    const selectedType = this.positionTypes.find(t => t.ID === this.model.KPIPositionTypeID);
    if (selectedType) {
      this.model.PositionCode = selectedType.TypeCode || '';
      this.model.PositionName = selectedType.TypeName || '';
    }
  }

  /**
   * Thêm loại chuyên môn mới
   */
  onAddPositionType(): void {
    const modalRef = this.modalService.open(KpiPositionTypeDetailComponent, {
      centered: true,
      backdrop: 'static',
      size: 'md'
    });
    modalRef.componentInstance.departmentId = this.departmentId;
    modalRef.componentInstance.kpiSessionId = this.model.KPISessionID;
    modalRef.componentInstance.kpiPositionType = {};
    modalRef.componentInstance.isEditMode = false;

    modalRef.result.then(
      (result) => {
        if (result?.success) {
          this.loadPositionTypes();
        }
      },
      () => { }
    );
  }

  validate(): boolean {
    this.errors = {};
    let isValid = true;

    if (!this.model.PositionCode || this.model.PositionCode.trim() === '') {
      this.errors.code = 'Vui lòng nhập mã chức vụ';
      isValid = false;
    }

    if (!this.model.PositionName || this.model.PositionName.trim() === '') {
      this.errors.name = 'Vui lòng nhập tên chức vụ';
      isValid = false;
    }

    if (!this.model.KPISessionID) {
      this.errors.kpiSessionId = 'Vui lòng chọn kỳ đánh giá';
      isValid = false;
    }

    if (!this.model.TypePosition) {
      this.errors.typePosition = 'Vui lòng chọn loại vị trí';
      isValid = false;
    }

    return isValid;
  }

  /**
   * Lưu và đóng modal 
   */
  saveAndClose(): void {
    if (!this.validate()) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng kiểm tra lại thông tin');
      return;
    }

    this.save(() => {
      this.activeModal.close({ success: true, data: this.model });
    });
  }

  /**
   * Lưu và thêm mới
   */
  saveAndNew(): void {
    if (!this.validate()) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng kiểm tra lại thông tin');
      return;
    }

    this.save(() => {
      this.notification.success(NOTIFICATION_TITLE.success, 'Lưu thành công! Tiếp tục thêm mới.');
      // Reset model for new entry
      this.model = {
        ID: 0,
        PositionCode: '',
        PositionName: '',
        STT: 0,
        TypePosition: null,
        KPISessionID: this.model.KPISessionID, // Keep current session
        KPIPositionTypeID: null
      };
      this.errors = {};
    });
  }

  /**
   * Lưu dữ liệu
   */
  private save(onSuccess: () => void): void {
    const payload = {
      ID: this.model.ID || 0,
      PositionCode: (this.model.PositionCode || '').trim(),
      PositionName: (this.model.PositionName || '').trim(),
      STT: this.model.STT || 0,
      TypePosition: this.model.TypePosition,
      KPISessionID: this.model.KPISessionID,
      KPIPositionTypeID: this.model.KPIPositionTypeID,
      IsDeleted: false
    };

    this.service.savePosition(payload).subscribe({
      next: (response: any) => {
        if (response?.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Lưu thành công');
          this.onSaved.emit(response.data);
          onSuccess();
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Lưu thất bại');
        }
      },
      error: (error: any) => {
        console.error('Error saving:', error);
        const errorMsg = error?.error?.message || 'Có lỗi xảy ra khi lưu dữ liệu';
        this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
      }
    });
  }

  /**
   * Đóng modal
   */
  cancel(): void {
    this.activeModal.dismiss();
  }
}
