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
import { ProductsaleServiceService } from '../product-sale-service/product-sale-service.service';
interface Location {
  ID?: number,
  LocationCode: string,
  LocationName: string,
  ProductGroupID: number
}

@Component({
  selector: 'app-location-detail',
  standalone:true,
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
  templateUrl: './location-detail.component.html',
  styleUrl: './location-detail.component.css'
})
export class LocationDetailComponent implements OnInit, AfterViewInit {
  newLocation: Location={
    LocationCode: '',
    LocationName: '',
    ProductGroupID: 0
  }
  @Input() listProductGroupcbb: any[] = [];
  constructor(
    private notification: NzNotificationService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private productsaleService: ProductsaleServiceService
  ) { }
  ngOnInit(): void {
    
  }
  ngAfterViewInit(): void {
    
  }
  addNewLocation(){
    if (!this.newLocation.LocationName || !this.newLocation.LocationCode || !this.newLocation.ProductGroupID) {
      this.notification.warning('Thông báo', 'Vui lòng điền đầy đủ thông tin!');
      return;
    }
    const payload = [{   
        LocationCode: this.newLocation.LocationCode,
        LocationName: this.newLocation.LocationName,
        ProductGroupID: this.newLocation.ProductGroupID,
    }];
    this.productsaleService.saveDataLocation(payload).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success('Thông báo', 'Thêm mới thành công!');
          this.closeModal();
        } else {
          this.notification.warning('Thông báo', res.message || 'Không thể thêm vị trí!');
        }
      },
      error: (err) => {
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi thêm mới!');
        console.error(err);
      }
    });
  }
  closeModal() {
    this.activeModal.dismiss(true);
  }
}
