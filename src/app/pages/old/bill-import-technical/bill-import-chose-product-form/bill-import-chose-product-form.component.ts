
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import {Component,OnInit,Input,Output,EventEmitter,inject,AfterViewInit} from '@angular/core'; import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TbProductRtcService } from '../../tb-product-rtc/tb-product-rtc-service/tb-product-rtc.service';
import { BillImportTechnicalService } from '../bill-import-technical-service/bill-import-technical.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
// @ts-ignore
import { saveAs } from 'file-saver';
import { NOTIFICATION_TITLE } from '../../../../app.config';
@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    NzCardModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NgbModalModule
  ],
  selector: 'app-bill-import-chose-product-form',
  templateUrl: './bill-import-chose-product-form.component.html',
  styleUrls: ['./bill-import-chose-product-form.component.css']
})
export class BillImportChoseProductFormComponent implements OnInit, AfterViewInit {
  private ngbModal = inject(NgbModal);
  @Input() dataInput: any;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<any[]>();
  constructor(private notification: NzNotificationService,
    private billImportTechnicalService: BillImportTechnicalService,
    private modalService: NgbModal,
    private tbProductRtcService: TbProductRtcService
  ) { }
  productTable: Tabulator | null = null;
  productGroupData: any[] = [];
  productData: any[] = [];
  productGroupID: number = 0;
  keyWord: string = "";
  checkAll: number = 0;
  warehouseID: number = 0;
  productRTCID: number = 0;
  productGroupNo: string = "";
  Size: number = 100000;
  Page: number = 1;
  billImportTechnicalData: any[] = [];
  billImportTechnicalDetailData: any[] = [];
  billImportTechnicalTable: Tabulator | null = null;
  billImportTechnicalDetailTable: Tabulator | null = null;
  dateStart: string = '';
  dateEnd: string = '';
  employeeID: number | null = null;
  status: number[] = [];
  searchTimeout: any;
  public activeModal = inject(NgbActiveModal);
  filterText: string = '';
  selectedApproval: number | null = null;
  isSearchVisible: boolean = false;
  ngOnInit() {
  }
  ngAfterViewInit(): void {
    this.drawTable();
  }
  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
  drawTable() {
    this.productTable = new Tabulator('#dataTableProduct11', {
      layout: "fitDataStretch",
      pagination: true,
      height:'60vh',
      selectableRows: 5,
      ajaxURL: this.tbProductRtcService.getProductAjax(),
      ajaxConfig: "POST",
      paginationMode: 'remote',
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: "center",
        minWidth: 60,
        resizable: true
      },
      movableColumns: true,
      paginationSize: 30,
      paginationSizeSelector: [5, 10, 20, 50, 100],
      reactiveData: true,
      ajaxRequestFunc: (url, config, params) => {
        const request = {
          productGroupID: this.productGroupID || 0,
          keyWord: this.keyWord || this.filterText || "", // <-- sửa dòng này
          checkAll: 1,
          warehouseID: this.warehouseID || 0,
          productRTCID: this.productRTCID || 0,
          productGroupNo: this.productGroupNo || "",
          page: params.page || 1,
          size: params.size || 30,
        };
        console.log("POST Request:", request);
        return this.tbProductRtcService.getProductRTC(request).toPromise();
      },
      ajaxResponse: (url, params, response) => {
        return {
          data: response.products || [],
          last_page: response.TotalPage?.[0]?.TotalPage || 1
        };

      },
      placeholder: 'Không có dữ liệu',
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
      dataTree: true,
      addRowPos: "bottom",
      history: true,
      columns: [
        {
          title: '',
          field: '',

          formatter: 'rowSelection',
          titleFormatter: 'rowSelection',
          hozAlign: 'center',

          headerHozAlign: 'center',
          headerSort: false,
          width: 60,
          cssClass: 'checkbox-center'
        },
        { title: "ID", field: "ID", visible: false },
        { title: "STT", field: "STT", visible: false },
        { title: "Mã sản phẩm", field: "ProductCode" },
        { title: "Tên sản phẩm", field: "ProductName" },
        { title: "Mã nhóm", field: "ProductGroupNo", visible: false },
        { title: "Tên nhóm", field: "ProductGroupName", visible: false },
        { title: "Mã nhóm RTC", field: "ProductGroupRTCID", visible: false },
        { title: "Hãng", field: "Maker" },
        { title: "Code RTC", field: "ProductCodeRTC" },
        { title: "Vị trí", field: "LocationName", visible: false },
        { title: "ID vị trí", field: "ProductLocationID", visible: false },
        { title: "Serial", field: "Serial", visible: false },
        { title: "Serial Number", field: "SerialNumber", visible: false },
        { title: "Part Number", field: "PartNumber", visible: false },
        { title: "Đơn vị tính", field: "UnitCountName", visible: false },
        { title: "UnitCountID", field: "UnitCountID", visible: false },
        { title: "Số lượng", field: "Number", visible: false },
        { title: "SL mượn", field: "NumberBorrowing", visible: false },
        { title: "SL tồn kho", field: "NumberInStore", visible: false },
        { title: "SL kiểm kê", field: "SLKiemKe", visible: false },
        { title: "SL thực tế", field: "InventoryReal", visible: false },
        { title: "Mượn KH?", field: "BorrowCustomer", formatter: "tickCross", visible: false },
        { title: "Khách mượn", field: "BorrowCustomerText", visible: false },
        { title: "Đã sử dụng?", field: "StatusProduct", formatter: "tickCross", visible: false },
        { title: "Ghi chú", field: "Note", visible: false },
        { title: "Người tạo", field: "CreatedBy", visible: false },
        { title: "Ngày tạo", field: "CreateDate", formatter: "datetime", formatterParams: { outputFormat: "DD/MM/YYYY HH:mm" }, visible: false },
        { title: "Lens Mount", field: "LensMount", visible: false },
        { title: "Focal Length", field: "FocalLength", visible: false },
        { title: "MOD", field: "MOD", visible: false },
        { title: "Magnification", field: "Magnification", visible: false },
        { title: "Sensor Size", field: "SensorSize", visible: false },
        { title: "Sensor Size Max", field: "SensorSizeMax", visible: false },
        { title: "Resolution", field: "Resolution", visible: false },
        { title: "Shutter Mode", field: "ShutterMode", visible: false },
        { title: "Mono/Color", field: "MonoColor", visible: false },
        { title: "Pixel Size", field: "PixelSize", visible: false },
        { title: "Lamp Type", field: "LampType", visible: false },
        { title: "Lamp Power", field: "LampPower", visible: false },
        { title: "Lamp Wattage", field: "LampWattage", visible: false },
        { title: "Lamp Color", field: "LampColor", visible: false },
        { title: "Data Interface", field: "DataInterface", visible: false },
        { title: "Input Value", field: "InputValue", visible: false },
        { title: "Output Value", field: "OutputValue", visible: false },
        { title: "Current Intensity Max", field: "CurrentIntensityMax", visible: false },
        { title: "Size", field: "Size", visible: false },
        { title: "Ảnh vị trí", field: "LocationImg", visible: false },
        { title: "AddressBox", field: "AddressBox", visible: false }
      ]
    });

  }

 onSearchChange() {
  clearTimeout(this.searchTimeout);
  this.searchTimeout = setTimeout(() => {
    this.productTable?.setData();
  }, 500);
}
  selectProducts() {
    if (!this.productTable) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không tìm thấy bảng sản phẩm.');
      return;
    }
    const selectedRows = this.productTable.getSelectedData();

    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một sản phẩm.');
      return;
    }
    const mappedData = selectedRows.map(row => ({
      ProductID: row.ID,
      ProductCode: row.ProductCode,
      ProductName: row.ProductName,
      ProductCodeRTC: row.ProductCodeRTC,
      Maker: row.Maker,
      UnitCountID: row.UnitCountID,
      UnitCountName: row.UnitCountName,
      ProductGroupNo: row.ProductGroupNo,
      ProductGroupName: row.ProductGroupName,
     // Note: row.Note || '',
      NumberInStore: row.NumberInStore,
      Serial: row.Serial,
      PartNumber: row.PartNumber,
      LocationName: row.LocationName,
      ProductLocationID: row.ProductLocationID,
      Specifications: row.SpecificationsAsset || '', // hoặc tên trường phù hợp
      CreatedBy: row.CreatedBy,
      CreatedDate: row.CreatedDate,
      Quantity:1
    }));
    this.formSubmitted.emit(mappedData);
    this.activeModal.dismiss();
  }

}
