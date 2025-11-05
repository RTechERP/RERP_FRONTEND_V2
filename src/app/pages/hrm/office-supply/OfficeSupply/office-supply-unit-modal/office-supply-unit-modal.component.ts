import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { OfficeSupplyService } from '../office-supply-service/office-supply-service.service';

interface Unit {
  ID: number;
  Name: string;
  Code: string;
}

@Component({
  selector: 'app-office-supply-unit-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule
  ],
  templateUrl: './office-supply-unit-modal.component.html',
  styleUrls: ['./office-supply-unit-modal.component.css']
})
export class OfficeSupplyUnitModalComponent implements OnInit, AfterViewInit {
  validateForm!: FormGroup;
  selectedItem: any = {};
  table2: any;
  dataTable2: any[]=[];
  listUnit: any[] = [];
  lastAddedId: number | null = null; // Thêm biến để theo dõi ID của đơn vị tính mới thêm

  constructor(
    private officeSupplyService: OfficeSupplyService,
    private notification: NzNotificationService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal
  ) { }


  ngOnInit(): void {
    this.initForm();
  }

  ngAfterViewInit(): void {
    this.drawTable();
    this.getUnit()
  }

  private initForm() {
    this.validateForm = this.fb.group({
      unitName: [null, [Validators.required]]
    });
  }
  getdataUnitbyid(id: number) {
    console.log("id", id);
    this.officeSupplyService.getdataUnitfill(id).subscribe({
      next: (response) => {
        console.log('Dữ liệu click sửa được:', response);
        let data = null;
        if (response?.data) {
          data = Array.isArray(response.data) ? response.data[0] : response.data;
        } else {
          data = response;
        }

        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          this.selectedItem = {
            ID: data['ID'] || '',
            Name: data['Name'] || '',
          };
          console.log('Selected item after API call:', this.selectedItem);
        } else {
          console.warn('Không có dữ liệu để fill');
          console.log('Giá trị data:', data);
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu:', err);
      }
    });
  }
  getUnit(): void {
    this.officeSupplyService.getUnit().subscribe({
      next: (res) => {
        console.log('Danh sách đơn vị tính:', res);
        this.listUnit = Array.isArray(res?.data) ? res.data : [];
        this.dataTable2 = res.data;
        if (this.table2) {
          this.table2.replaceData(this.dataTable2);
        } else {
          // Nếu table2 chưa được khởi tạo (ví dụ: trường hợp lỗi ngOnInit), gọi drawTable
          this.drawTable(); 
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy đơn vị tính:', err);
      }
    });
  }

  drawTable() {
    if (!this.table2) { // Chỉ khởi tạo nếu chưa có
      this.table2 = new Tabulator('#datatable2', {
        data: this.dataTable2,
        layout: 'fitDataFill',
        height: '50vh',
        pagination: true,
        paginationSize: 50,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
         langs: {
          vi: {
            pagination: {
              first: '<<',
              last: '>>',
              prev: '<',
              next: '>',
            },
          },
        },
        locale: 'vi',
        columns: [
          {
            title: 'Tên đơn vị',
            field: 'Name',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: "100%"
          }
        ]
      });

      // Thêm sự kiện click cho bảng thứ hai
      this.table2.on("rowClick", (e: MouseEvent, row: RowComponent) => {
        const rowData = row.getData();
        this.selectedItem = {
          ID: rowData['ID'],
          Name: rowData['Name']
        };
        console.log('Selected item:', this.selectedItem);
        // Gọi API để lấy dữ liệu chi tiết
        this.getdataUnitbyid(rowData['ID']);
      });
    }
  }
  saveSelectedItem() {
    if (!this.selectedItem?.Name) {
      this.notification.error('Thông báo', 'Tên đơn vị không được để trống!');
      return;
    }

    // Nếu không có ID hoặc ID = 0, tạo mới
    if (!this.selectedItem?.ID || this.selectedItem.ID === 0) {
      this.officeSupplyService.addUnit({ ID: 0, Name: this.selectedItem.Name }).subscribe({
        next: (response) => {
          if(response && response.data){
            const newItem = Array.isArray(response.data) ? response.data[0] : response.data;
          }
          this.notification.success('Thông báo', 'Thêm mới thành công!');
          this.selectedItem = {};
          this.getUnit();
        
        },
        error: (response:any) => {
          console.error('Lỗi khi thêm mới:', response);
          this.notification.error('Thông báo', response.error.message||'Có lỗi xảy ra khi thêm mới!');
        }
      });
    } else {
      // Nếu có ID, cập nhật
      this.officeSupplyService.updatedataUnit(this.selectedItem).subscribe({
        next: (response) => {
          this.notification.success('Thông báo', 'Cập nhật thành công!');
          this.selectedItem = {};
          this.getUnit();
         
        },
        error: (err) => {
          console.error('Lỗi khi cập nhật dữ liệu:', err);
          this.notification.error('Thông báo', 'Có lỗi xảy ra khi cập nhật dữ liệu!');
        }
      });
    }
  }

  closeModal() {
    this.activeModal.dismiss('cancel');
  }
}
