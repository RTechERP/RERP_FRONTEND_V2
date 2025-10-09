import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AfterViewInit, Component, OnInit, ViewEncapsulation, ViewChild, ElementRef, Input } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
declare var bootstrap: any;
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { ProductService } from './product.service';
@Component({
  standalone: true,
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css'],
  imports: [
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
    NgbModalModule,
  ]
})
export class ProductComponent implements OnInit, AfterViewInit {
  productData: any[] = [];
  categoryData: any[] = [];
  categoryTable: Tabulator | null = null;
  productTable: Tabulator | null = null;
  selectedRow: any = "";
  sizeTbDetail: any = '0';
  constructor(private productService: ProductService,
    private notification: NzNotificationService,
  ) { }

  ngOnInit() {
  }
  ngAfterViewInit(): void {
    this.getCategory();

  }
  //Lấy master danh mục sản phẩm
  private getCategory() {
    this.productService.getCategory().subscribe({
      next: (response) => {
        this.categoryData = response.data;
        this.drawTableCategory();
      },
      error: (err) => {
        this.notification.error('Error', 'Failed to load categories');
      }
    });
  }
  private drawTableCategory() {
    const columns: ColumnDefinition[] = [
      {
        title: 'STT',
        formatter: 'rownum',
        hozAlign: 'center',
        width: 60,
        headerSort: false
      },
      { title: 'ID', field: 'Id', width: 50, visible: false },
      { title: 'Name', field: 'Name', width: 150 },
    ];
    this.categoryTable = new Tabulator('#producttable', {
      data: this.categoryData,
      selectableRows: 1,
      columns: columns,
      layout: 'fitDataStretch',
    });
    this.categoryTable.on('rowClick', (evt, row: RowComponent) => {
      const rowData = row.getData();
      const id = rowData['Id'];
console.log('Selected Category ID:', id);
      this.productService.getCategoryDetail(id).subscribe({
        next: (response) => {
          this.productData = response.products;
          this.drawDetail();
        },
        error: (err) => {
          this.notification.error('Error', 'Không thể tải chi tiết sản phẩm');
        }
      });


    });
    this.categoryTable.on('rowClick', (e: UIEvent, row: RowComponent) => {
      this.selectedRow = row.getData();
      this.sizeTbDetail = null;
    });
  }
  private drawDetail(): void {
    if (this.productTable) {
      this.productTable.setData(this.productData);
    } else {
      this.productTable = new Tabulator('#databledetail', {
        data: this.productData,
        layout: "fitDataStretch",
        paginationSize: 5,

        movableColumns: true,
        reactiveData: true,
        columns: [
          {
            title: 'STT',
            formatter: 'rownum',
            hozAlign: 'center',
            width: 60,
            headerSort: false
          },
          { title: 'Id', field: 'Id', hozAlign: 'center', visible: false },
          { title: 'Name', field: 'Name', hozAlign: 'center' },
          { title: 'Price', field: 'Price', hozAlign: 'center' },
        ],
      });
    }
  }


}
