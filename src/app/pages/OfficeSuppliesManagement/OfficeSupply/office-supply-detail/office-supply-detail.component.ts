import { Component, OnInit, AfterViewInit, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css'; //import Tabulator stylesheet
import { RowComponent } from 'tabulator-tables';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OfficeSupplyService } from '../office-supply-service/office-supply-service.service';
import { OfficeSupplyUnitDetailComponent } from '../../OfficeSupplyUnit/office-supply-unit-detail/office-supply-unit-detail.component';
import { OfficeSupplyUnitService } from '../../OfficeSupplyUnit/office-supply-unit-service/office-supply-unit-service.service';

interface Product {
  ID?: number;
  CodeRTC: string;
  CodeNCC: string;
  NameRTC: string;
  NameNCC: string;
  SupplyUnitID: number;
  Price: number;
  RequestLimit: number;
  Type: number;
}
@Component({
  selector: 'app-office-supply-detail',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    NzSelectModule,
    NzSplitterModule,
    NzIconModule,
    NzButtonModule,
    NzProgressModule,
    NzInputModule,
    NzFormModule,
    NzInputNumberModule
  ],
  templateUrl: './office-supply-detail.component.html',
  styleUrl: './office-supply-detail.component.css'
})
export class OfficeSupplyDetailComponent implements  OnInit, AfterViewInit {
  @Input() newProduct!: Product;
  @Input() isCheckmode: boolean = false;
  @Input() listUnit: any[] = [];
  @Input() typeOptions: any[] = [];

  validateForm!: FormGroup;

  constructor(
    private officesupplyService: OfficeSupplyService,
    private officesupplyunitService: OfficeSupplyUnitService,
    private notification: NzNotificationService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal
  ) { }

  private initForm() {
    this.validateForm = this.fb.group({
      unitName: [null, [Validators.required]]
    });
  }
  ngOnInit(): void {
    this.initForm();
  }

  ngAfterViewInit(): void {
    if (this.listUnit.length === 0) {
      this.getUnits();
    }
  }
  getUnits(): void {
    this.officesupplyService.getUnit().subscribe({
      next: (res) => {
        console.log('Danh sách đơn vị tính:', res);
        this.listUnit = Array.isArray(res?.data) ? res.data : [];
      },
      error: (err) => {
        console.error('Lỗi khi lấy đơn vị tính:', err);
      }
    });
  }
  addNewUnit() {
    const modalRef = this.modalService.open(OfficeSupplyUnitDetailComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.isCheckmode = false;
    modalRef.componentInstance.selectedItem = {};
  
    modalRef.result.then(
      (result) => {
        if (result === 'success') {
          this.getUnits(); // Refresh unit list
        }
      },
      (reason) => {
        console.log('Modal dismissed:', reason);
      }
    );
  }

  add(): void {
    if (!this.newProduct.CodeNCC || !this.newProduct.NameNCC || !this.newProduct.Price || !this.newProduct.SupplyUnitID) {
      this.notification.warning('Thông báo', 'Vui lòng điền đầy đủ thông tin!');
      return;
    }
    this.officesupplyService.adddata(this.newProduct).subscribe({
      next: (res) => {
        this.notification.success('Thông báo', 'Thêm thành công!');
        this.activeModal.close('success');
      },
      error: (err) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi thêm dữ liệu!');
      }
    });
  }

  update(): void {
    if (!this.newProduct.CodeNCC || !this.newProduct.NameNCC || !this.newProduct.Price || !this.newProduct.SupplyUnitID) {
      this.notification.warning('Thông báo', 'Vui lòng điền đầy đủ thông tin!');
      return;
    }
    console.log('Dữ liệu update:', this.newProduct);
    this.officesupplyService.updatedata(this.newProduct).subscribe({
      next: (res) => {
        this.notification.success('Thông báo', 'Cập nhật thành công!');
        this.activeModal.close('success');
      },
      error: (err) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi cập nhật dữ liệu!');
      }
    });
  }

  closeModal() {
    this.activeModal.dismiss('cancel');
  }
}
