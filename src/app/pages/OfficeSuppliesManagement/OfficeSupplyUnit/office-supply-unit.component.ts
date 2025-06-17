import { Component, OnInit,AfterViewInit, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { RowComponent } from 'tabulator-tables';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';
import { OfficeSupplyUnitService} from './office-supply-unit-service/office-supply-unit-service.service';
import { OfficeSupplyUnitDetailComponent } from './office-supply-unit-detail/office-supply-unit-detail.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

interface newOfficeSupplyUnit{
  ID?: number;
  Name:string;
}
@Component({
  selector: 'app-office-supply-unit-component',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule, 
    NzModalModule, 
    NzSplitterModule,
    NzIconModule,
    NzTypographyModule,
    NzButtonModule,
    NzFormModule,
    OfficeSupplyUnitDetailComponent,
  ],
  templateUrl: './office-supply-unit.component.html',
  styleUrl: './office-supply-unit.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class OfficeSupplyUnitComponent implements OnInit, AfterViewInit {
  newOfficeSupplyUniy: newOfficeSupplyUnit = {
   Name:""
  };
  lstOUS: any[] = [];
  table: any; // instance của Tabulator
  dataTable: any[] = [];
  searchText: string = '';
  selectedItem: any = {};
  isCheckmode: boolean = false;
  selectedList: any[] = [];
  lastAddedId: number | null = null; // Thêm biến để theo dõi ID của đơn vị mới thêm
  sizeSearch: string = '0';
  sizeTable: string = '0';
  private fb: NonNullableFormBuilder;
  validateForm: any;

  constructor(
    private officesupplyunitSV: OfficeSupplyUnitService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService
  ) {
    this.fb = inject(NonNullableFormBuilder);
    this.initForm();
  }

  private initForm() {
    this.validateForm = this.fb.group({
      unitName: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.drawTable();
      this.get();
  }
  drawTable() {
    if (this.table) {
      this.table.replaceData(this.dataTable);
    } else {
      this.table = new Tabulator('#datatable', {
        layout: 'fitDataFill',
        height: 'calc(100% - 40px)',
        pagination: true,
        paginationSize: 20,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        selectableRows:15,    
        columns: [
          {
            title: "",
            formatter: "rowSelection",
            titleFormatter: "rowSelection",
            hozAlign: "center",
            headerHozAlign: "center",
            headerSort: false,
            width: 40,
            frozen: true,

          },       
          {
            title: 'Tên đơn vị',
            field: 'Name',
            hozAlign: 'left',
            headerHozAlign: 'left',
            width: "90%"
          }
        ]
      });
      this.table.on("rowClick", (e: MouseEvent, row: RowComponent) => {
        const rowData = row.getData();
        this.getdatabyid(rowData['ID']);
      });
    }
  }
  getdatabyid(id: number) {
    console.log("id", id);
    this.officesupplyunitSV.getdatafill(id).subscribe({
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
            ID: data.ID || '',
            Name: data.Name || '',
          };
          // Set giá trị vào form
          this.validateForm.patchValue({
            unitName: data.Name
          });
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

  onNameChange(value: string) {
    // Nếu người dùng xóa hết và gõ cái gì đó khác ban đầu
    if (!value || value.trim() === '') {
      this.selectedItem = { ID: 0, Name: '' };
    }
  }
  deleteUnit() {
    var dataSelect = this.table.getSelectedData();
    this.selectedList = dataSelect; // Cập nhật lại selectedList với dữ liệu mới nhất
    const ids = this.selectedList.map(item => item.ID);
    if (ids.length == 0) {
      this.notification.warning("Thông báo", "Vui lòng chọn ít nhất 1 sản phẩm để xóa!");
      return;
    }
    else {
      this.modal.create({
        nzTitle: 'Thông báo',
        nzContent: `Bạn có chắc chắn muốn xóa đơn vị: ${this.selectedList.map(item => item.Name).join(' , ')} !`,
        nzOkText: 'Lưu',
        nzOkType: 'primary',
        nzOkDanger: true,
        nzOnOk: () => {
          this.officesupplyunitSV.deletedata(ids).subscribe({
            next: () => {
             this.notification.success("Thông báo", `Xóa thành công ${this.selectedList.length} đơn vị!`);
              this.get();
              this.selectedList = [];
            },
            error: (err: any) => {
              this.notification.error("Thông báo", "Có lỗi xảy ra khi xóa dữ liệu!");
            }
          });
        },
        nzCancelText: 'Hủy',
        nzClosable: true,
        nzMaskClosable: true
      });
    }
  }
  openUnitModal() {
    const modalRef = this.modalService.open(OfficeSupplyUnitDetailComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.isCheckmode = this.isCheckmode;
    modalRef.componentInstance.selectedItem = this.selectedItem;

    modalRef.result.then(
      (result) => {
        if (result === 'success') {
          this.get();
        }
      },
      (reason) => {
        console.log('Modal dismissed:', reason);
      }
    );
  }
  openUnitModalForNewUnit() {
    this.isCheckmode = false;
    this.selectedItem = {};
    this.validateForm.reset();
    this.openUnitModal();
  }
  openUnitModalForUpdateUnit() {
    this.isCheckmode = true;
    var dataSelect = this.table.getSelectedData();
    this.selectedList = dataSelect;
    const ids = this.selectedList.map(item => item.ID);
    if (this.selectedList.length == 0) {
      this.notification.warning("Thông báo", "Vui lòng chọn 1 sản phẩm để sửa!");
      this.selectedList = [];
      return;
    } else if (this.selectedList.length > 1) {
      this.notification.warning("Thông báo", "Vui lòng chỉ chọn 1 sản phẩm để sửa!");
      this.selectedList = [];
      return;
    } else {
      this.getdatabyid(this.selectedList[0].ID);
      this.openUnitModal();
    }
  }

  closeUnitModal() {
    this.modalService.dismissAll();
  }
  get(): void {
    this.officesupplyunitSV.getdata().subscribe({
      next: (response) => {
        console.log('Dữ liệu nhận được:', response);
        this.lstOUS = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];

        // Sắp xếp dữ liệu: đơn vị mới nhất lên đầu, các đơn vị khác theo thứ tự tăng dần
        if (this.lastAddedId) {
          const newItem = this.lstOUS.find(item => item.ID === this.lastAddedId);
          if (newItem) {
            // Tách đơn vị mới ra khỏi danh sách
            this.lstOUS = this.lstOUS.filter(item => item.ID !== this.lastAddedId);
            // Sắp xếp các đơn vị còn lại theo ID tăng dần
            this.lstOUS.sort((a, b) => a.ID - b.ID);
            // Thêm đơn vị mới vào đầu danh sách
            this.lstOUS.unshift(newItem);
          }
        } else {
          // Nếu không có đơn vị mới, sắp xếp tất cả theo ID tăng dần
          this.lstOUS.sort((a, b) => a.ID - b.ID);
        }

        // Cập nhật lại dataTable và reload bảng
        this.dataTable = this.lstOUS;
        if (this.table) {
          this.table.replaceData(this.dataTable);
        } else {
          this.drawTable(); // Lần đầu thì vẽ bảng
        }
      },
      error: (err) => {
        console.error('Lỗi khi gọi API:', err);
        this.lstOUS = [];
        this.dataTable = [];
        this.drawTable();
      },
    });
  }

}


