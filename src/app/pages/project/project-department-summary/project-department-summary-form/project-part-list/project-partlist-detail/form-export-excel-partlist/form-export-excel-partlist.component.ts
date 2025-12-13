import {
  Component,
  Input,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { DEFAULT_TABLE_CONFIG } from '../../../../../../../tabulator-default.config';
import { AuthService } from '../../../../../../../auth/auth.service';
@Component({
  selector: 'app-form-export-excel-partlist',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzSplitterModule,
    NzInputModule,
    NzToolTipModule,
  ],
  templateUrl: './form-export-excel-partlist.component.html',
  styleUrl: './form-export-excel-partlist.component.css',
})
export class FormExportExcelPartlistComponent implements OnInit, AfterViewInit {
  @Input() projectId: number = 0;
  @Input() projectCode: string = '';
  @Input() projectName: string = '';
  @Input() versionPOID: number = 0;
  @Input() partListData: any[] = [];

  @ViewChild('tb_ExportProjectPartList', { static: false })
  tb_ExportProjectPartListContainer!: ElementRef;

  tb_ExportProjectPartList!: Tabulator;
  showSearchPanel: boolean = false;
  currentUser: any = {};
  // Search fields
  searchKeyword: string = '';
  searchMaker: string = '';
  searchSupplier: string = '';

  // Original data for filtering
  originalData: any[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.getCurrentUser();
  }
  getCurrentUser() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      this.currentUser = res.data;
      // Enrich data after getting current user
      if (this.partListData && this.partListData.length > 0) {
        this.originalData = this.enrichDataWithProjectInfo([...this.partListData]);
        // Update partListData with enriched data
        this.partListData = this.enrichDataWithProjectInfo([...this.partListData]);
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.drawTbExportProjectPartList(
        this.tb_ExportProjectPartListContainer.nativeElement
      );
    }, 100);
  }

  toggleSearchPanel(): void {
    this.showSearchPanel = !this.showSearchPanel;
  }

  searchData(): void {
    if (!this.tb_ExportProjectPartList) return;

    // Ensure originalData is enriched before filtering
    const enrichedOriginalData = this.originalData && this.originalData.length > 0
      ? this.enrichDataWithProjectInfo([...this.originalData])
      : this.originalData;
    let filteredData = [...enrichedOriginalData];

    if (this.searchKeyword && this.searchKeyword.trim()) {
      const keyword = this.searchKeyword.toLowerCase().trim();
      filteredData = filteredData.filter(
        (item) =>
          (item.ProductCode &&
            item.ProductCode.toLowerCase().includes(keyword)) ||
          (item.ProductName &&
            item.ProductName.toLowerCase().includes(keyword)) ||
          (item.Model && item.Model.toLowerCase().includes(keyword)) ||
          (item.TT && item.TT.toString().toLowerCase().includes(keyword))
      );
    }

    if (this.searchMaker && this.searchMaker.trim()) {
      const maker = this.searchMaker.toLowerCase().trim();
      filteredData = filteredData.filter(
        (item) => item.Maker && item.Maker.toLowerCase().includes(maker)
      );
    }

    if (this.searchSupplier && this.searchSupplier.trim()) {
      const supplier = this.searchSupplier.toLowerCase().trim();
      filteredData = filteredData.filter(
        (item) =>
          (item.NCC && item.NCC.toLowerCase().includes(supplier)) ||
          (item.SupplierNamePurchase &&
            item.SupplierNamePurchase.toLowerCase().includes(supplier))
      );
    }

    this.tb_ExportProjectPartList.setData(filteredData);
  }

  resetSearch(): void {
    this.searchKeyword = '';
    this.searchMaker = '';
    this.searchSupplier = '';
    if (this.tb_ExportProjectPartList) {
      // Ensure originalData is enriched before setting
      const enrichedOriginalData = this.originalData && this.originalData.length > 0
        ? this.enrichDataWithProjectInfo([...this.originalData])
        : this.originalData;
      this.tb_ExportProjectPartList.setData(enrichedOriginalData);
    }
  }

  formatNumber(value: any): string {
    if (value === null || value === undefined || value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toLocaleString('vi-VN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  formatDate(value: any): string {
    if (!value) return '';
    const dateTime = DateTime.fromISO(value);
    return dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
  }

  // Enrich data with project information
  enrichDataWithProjectInfo(data: any[]): any[] {
    const enrich = (nodes: any[]): any[] => {
      return nodes.map((node: any) => {
        const enrichedNode = {
          ...node,
          MaDuAn_Label: 'Mã dự án:',
          MaDuAn_Value: this.projectCode || '',
          TenDuAn_Value: this.projectName || '',
          NguoiLap_Label: this.currentUser?.FullName || '',
        };
        
        // Recursively enrich children
        if (node._children && node._children.length > 0) {
          enrichedNode._children = enrich(node._children);
        }
        
        return enrichedNode;
      });
    };
    return enrich(data);
  }

  // Flatten tree data to array (recursive)
  flattenTreeData(treeData: any[]): any[] {
    const result: any[] = [];
    const flatten = (nodes: any[]) => {
      nodes.forEach((node: any) => {
        result.push(node);
        if (node._children && node._children.length > 0) {
          flatten(node._children);
        }
      });
    };
    flatten(treeData);
    return result;
  }

  drawTbExportProjectPartList(container: HTMLElement): void {
    // Ensure data is enriched before displaying
    const enrichedData = this.partListData && this.partListData.length > 0 
      ? this.enrichDataWithProjectInfo([...this.partListData])
      : [];
    
    this.tb_ExportProjectPartList = new Tabulator(container, {
      data: enrichedData,
      layout: 'fitDataStretch',
      ...DEFAULT_TABLE_CONFIG,
      pagination:false,
      rowHeader: false,
      dataTree: true,
      dataTreeStartExpanded: true,
      dataTreeChildField: '_children',
      dataTreeElementColumn: 'TT',
      rowFormatter: (row: any) => {
        const rowData = row.getData();
        // Set màu xám cho các dòng cha (có _children)
        if (rowData._children && rowData._children.length > 0) {
          const rowElement = row.getElement();
          if (rowElement) {
            rowElement.style.backgroundColor = '#E0E0E0'; // Màu xám
          }
        }
      },
      columns: [
       
            {
              title: '',
              columns: [
                {
                  title: '',
                  field: '',
                  width: 150,
                  headerHozAlign: 'left',
                  columns: [
                    {
                      title: '',
                      columns: [
                        {
                          title: 'Người lập',
                          headerHozAlign: 'left',
                          columns: [
                            {
                              title: '',
                              field: 'NguoiLap_Label',
                              width: 120,
                              headerHozAlign: 'right',
                              columns: [{
                                title: 'Ngày',
                                width: 120,
                                columns: [
                                  {
                                    title: 'TT',
                                    field: 'TT',
                                    width: 150,
                                    hozAlign: 'center',
                                  }
                                ]
                              },
                              {
                                title: ''+DateTime.now().toFormat('dd/MM/yyyy'),
                                field: '',
                                columns: [
                                  {
                                    title: 'Tên vật tư',
                                    field: 'GroupMaterial',
                                    width: 150,
                                    formatter:'textarea'
                                  }
                                ]
                              },
                              ]
                            }
                          ]
                        }
                      ]
                    },
                  ]
                }
             
          ]
        },
        {
          title: 'DANH MỤC VẬT TƯ',
          headerHozAlign: 'center',
          columns: [
           
                {
                  title: 'Mã dự án:',
                  field: 'MaDuAn_Label',
                  width: 120,
                  headerHozAlign: 'right',
                  columns: [
                    {
                      title: 'Tên dự án:',
                      field: '',
                      width: 150,
                      headerHozAlign: 'left',
                      columns: [
                        {
                          title: 'Kiểm tra:',
                          field: '',
                          width: 150,
                          headerHozAlign: 'left',
                          columns: [
                            {
                              title: '',
                              field: '',
                              width: 150,
                              headerHozAlign: 'left',
                              columns: [
                                {
                                  title: 'Ngày:',
                                  field: '',
                                  width: 150,
                                  headerHozAlign: 'left',
                                  columns: [
                                    {
                                      title: 'Mã thiết bị',
                                      field: 'ProductCode',
                                      width: 150,
                                      headerHozAlign: 'left',
                                      formatter:'textarea'
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  title: this.projectCode,
                  field: 'MaDuAn_Value',
                  width: 140,
                  headerHozAlign: 'left',
                  columns: [
                    {
                      title: this.projectName || '',
                      field: 'TenDuAn_Value',
                      width: 150,
                      headerHozAlign: 'left',
                      columns: [
                        {
                          title: '',
                          field: '',
                          width: 150,
                          headerHozAlign: 'left',
                          columns: [
                            {
                              title: '',
                              field: '',
                              width: 150,
                              headerHozAlign: 'left',
                              columns: [
                                {
                                  title: '',
                                  field: '',
                                  width: 150,
                                  headerHozAlign: 'left',
                                  columns: [
                                    {
                                      title: 'Mã đặt hàng',
                                      field: 'BillCodePurchase',
                                      width: 150,
                                      headerHozAlign: 'left',
                                    },
                                    {
                                      title: 'Hãng SX',
                                      field: 'Manufacturer',
                                      width: 150,
                                      headerHozAlign: 'left',
                                    },
                                  ]
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                
                {
                  title: '',
                  field: '',
                  width: 150,
                  headerHozAlign: 'left',
                      columns: [
                        {
                          title: '',
                          field: '',
                          width: 150,
                          headerHozAlign: 'left',
                          columns: [
                            {
                              title: 'Phê duyệt',
                              field: '',
                              width: 150,
                              headerHozAlign: 'left',
                              columns: [
                                {
                                  title: '',
                                  field: '',
                                  width: 150,
                                  headerHozAlign: 'left',
                                  columns: [
                                    {
                                      title: 'Ngày: ',
                                      field: '',
                                      width: 150,
                                      headerHozAlign: 'left',
                                      columns: [
                                        {
                                          title: 'Thông số kỹ thuật ',
                                          field: 'Model',
                                          width: 150,
                                          headerHozAlign: 'left',
                                        }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            }
                        
                      ]
                    }
                  ]
                }
             
          ]
        },
        {
          title: '',
          columns: [
            {
              title: 'BM03-RTC.TE-QT01\nBan hành lần: 02\nNgày: ',
              headerHozAlign: 'left',
              columns: [
                {
                  title: '',
                  field: '',
                  width: 150,
                  headerHozAlign: 'left',
                  columns: [
                    {
                      title: '',
                      field: '',
                      width: 150,
                      columns: [
                        {
                          title: '',
                          field: '',
                          width: 150,
                          headerHozAlign: 'left',
                          columns: [
                            {
                              title: '',
                              field: '',
                              columns: [
                                {
                                  title: 'Số lượng/1 máy',
                                  field: 'QtyMin',
                              width: 150,
                              headerHozAlign: 'center',
                                  hozAlign: 'right',
                                  formatter: (cell: any) => this.formatNumber(cell.getValue()),
                            },
                            {
                              title: 'Số lượng tổng',
                                  field: 'QtyFull',
                              width: 150,
                              headerHozAlign: 'center',
                                  hozAlign: 'right',
                                  formatter: (cell: any) => this.formatNumber(cell.getValue()),
                            },
                            {
                              title: 'Đơn vị',
                                  field: 'Unit',
                              width: 150,
                              headerHozAlign: 'center',
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
          },
        {
          title: '',
          columns: [
            {
              title: '',
              columns: [
                {
                  title: '',
                  columns: [
                    {
                      title: '',
                      columns: [
                        {
                          title: '',
                          columns: [
                            {
                              title: 'Đơn giá KT nhập',
                              field: 'Price',
                              hozAlign: 'right',
                              width: 120,
                              formatter: (cell: any) => this.formatNumber(cell.getValue()),
                            },
                            {
                              title: 'Thành tiền KT nhập',
                              field: 'Amount',
                              hozAlign: 'right',
                              width: 150,
                              formatter: (cell: any) => this.formatNumber(cell.getValue()),
                            },
                
                            { title: 'Tiến độ', field: 'LeadTime', width: 120 },
                            { title: 'Nhà cung cấp', field: 'NameNCCPriceQuote', width: 180 ,  formatter:'textarea'},
                
                            {
                              title: 'Ngày yêu cầu đặt hàng',
                              field: 'RequestDate',
                              width: 160,
                              formatter: (cell: any) => this.formatDate(cell.getValue()),
                            },
                            { title: 'Tiến độ yêu cầu', field: 'LeadTimePurchase', width: 150 },
                
                            {
                              title: 'SL đặt thực tế',
                              field: '',
                              width: 120,
                              hozAlign: 'right',
                              formatter: (cell: any) => this.formatNumber(cell.getValue()),
                            },
                            { title: 'Nhà cung cấp mua', field: 'SupplierNamePurchase', width: 120 , formatter:'textarea'},
                            { title: 'Giá đặt mua', field: 'PriceOrder', width: 150,
                              hozAlign: 'right',
                              formatter: (cell: any) => this.formatNumber(cell.getValue()),
                            },
                            { title: 'Ngày đặt hàng thực tế', field: 'RequestDatePurchase', width: 150,
                              formatter: (cell: any) => this.formatDate(cell.getValue()),
                             },
                             { title: 'Dự kiến hàng về', field: 'ExpectedReturnDate', width: 150,
                              formatter: (cell: any) => this.formatDate(cell.getValue()),
                             },
                             {
                              title: 'Tình trạng', field: 'StatusText', width: 150,
                             },
                             {
                              title: 'Chất lượng', field: 'Quality', width: 150,
                             },
                             {
                              title: 'Ghi chú', field: 'Note', width:300,
                              formatter:'textarea'
                             },
                             {
                              title: 'Lý do phát sinh', field: 'ReasonProblem', width: 300,
                              formatter:'textarea'
                             },
                             {
                              title: 'Mã đặc biệt', field: 'SpecialCode', width: 150,
                             },
                             {
                              title: 'Đơn giá Pur báo', field: 'UnitPriceQuote', width: 150,
                              formatter: (cell: any) => this.formatNumber(cell.getValue()),
                             },
                             {
                              title: 'Thành tiền Pur báo', field: 'TotalPriceQuote1', width: 150,
                              formatter: (cell: any) => this.formatNumber(cell.getValue()),
                             },
                             {
                              title: 'Loại tiền Pur báo', field: 'CurrencyQuote', width: 140,
                             },                
                            {
                              title: 'Tỷ giá báo',
                              field: 'CurrencyRateQuote',
                              width: 100,
                              hozAlign: 'right',
                              formatter: (cell: any) => this.formatNumber(cell.getValue()),
                            },
                            {
                              title: 'Thành tiền quy đổi báo giá (VNĐ)',
                              field: 'TotalPriceExchangeQuote',
                              hozAlign: 'right',
                              width: 200,
                              formatter: (cell: any) => this.formatNumber(cell.getValue()),
                            },
                
                            {
                              title: 'Đơn giá Pur mua',
                              field: 'UnitPricePurchase',
                              hozAlign: 'right',
                              width: 140,
                              formatter: (cell: any) => this.formatNumber(cell.getValue()),
                            },
                            {
                              title: 'Thành tiền Pur mua',
                              field: 'TotalPricePurchase',
                              hozAlign: 'right',
                              width: 150,
                              formatter: (cell: any) => this.formatNumber(cell.getValue()),
                            },
                            { title: 'Loại tiền Pur mua', field: 'CurrencyPurchase', width: 140 },
                            {
                              title: 'Tỷ giá mua',
                              field: 'CurrencyRatePurchase',
                              width: 100,
                              hozAlign: 'right',
                              formatter: (cell: any) => this.formatNumber(cell.getValue()),
                            },
                            {
                              title: 'Thành tiền quy đổi mua (VNĐ)',
                              field: 'TotalPriceExchangePurchase',
                              hozAlign: 'right',
                              width: 200,
                              formatter: (cell: any) => this.formatNumber(cell.getValue()),
                            },
                
                            { title: 'Leadtime Pur báo giá', field: 'LeadTimeQuote', width: 170 },
                            { title: 'Leadtime Pur đặt mua', field: 'LeadTimePurchase', width: 170 },
                
                            {
                              title: 'SL đã về',
                              field: 'QuantityReturn',
                              width: 100,
                              hozAlign: 'right',
                              formatter: (cell: any) => this.formatNumber(cell.getValue()),
                            },
                            { title: 'Mã nội bộ', field: 'ProductNewCode', width: 120 },
                            { title: 'Số HĐ đầu vào', field: 'SomeBill', width: 150 },
                            {
                              title: 'SL đã về',
                              field: 'QuantityReturn',
                              width: 100,
                              hozAlign: 'right',
                              formatter: (cell: any) => this.formatNumber(cell.getValue()),
                            },
                            {
                              title: 'SL đã xuất',
                              field: 'TotalExport',
                              width: 100,
                              hozAlign: 'right',
                              formatter: (cell: any) => this.formatNumber(cell.getValue()),
                            },
                            {
                              title: 'SL còn lại',
                              field: 'RemainQuantity',
                              width: 100,
                              hozAlign: 'right',
                              formatter: (cell: any) => this.formatNumber(cell.getValue()),
                            },
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
  });
}

  async exportExcel(): Promise<void> {
    if (!this.tb_ExportProjectPartList) return;

    // Lấy toàn bộ dữ liệu tree (cả node cha và node con) từ dữ liệu gốc
    // Enrich data with project info before flattening
    const enrichedTreeData = this.partListData && this.partListData.length > 0
      ? this.enrichDataWithProjectInfo([...this.partListData])
      : [];
    // Flatten tree data để export tất cả các node
    const data = this.flattenTreeData(enrichedTreeData);
    
    if (!data || data.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Không có dữ liệu để xuất Excel!'
      );
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh mục vật tư');

    // ===== HEADER SECTION (Rows 1-6) =====
    // Row 1: Title "DANH MỤC VẬT TƯ"
   // ===== MERGE CELLS (HEADER) =====
worksheet.mergeCells('A1:A3');
worksheet.mergeCells('B1:B3');
worksheet.mergeCells('A4:B4');
worksheet.mergeCells('A5:B5');

worksheet.mergeCells('C1:F1'); 
// worksheet.mergeCells('C2:D2');
worksheet.mergeCells('G2:I2');
worksheet.mergeCells('G3:I3');

// ===== HEADER VALUES =====
worksheet.getCell('C1').value = 'DANH MỤC VẬT TƯ';
worksheet.getCell('C1').font = { bold: true, size: 14 };
worksheet.getCell('C1').alignment = { horizontal: 'center', vertical: 'middle' };

worksheet.getCell('C2').value = 'Mã dự án:';
worksheet.getCell('C2').alignment = { horizontal: 'right' };
worksheet.getCell('D2').value = this.projectCode || '';

worksheet.getCell('C3').value = 'Tên dự án:';
worksheet.getCell('C3').alignment = { horizontal: 'right' };
worksheet.getCell('D3').value = this.projectName || '';

worksheet.getCell('G3').value = 'BM03-RTC.TE-QT01\nBan hành lần: 02';
worksheet.getCell('G3').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

worksheet.getCell('A4').value = 'Người lập:';
worksheet.getCell('B4').value = this.currentUser?.FullName || '';
worksheet.getCell('E4').value = 'Kiểm tra:';
worksheet.getCell('H4').value = 'Phê duyệt:';

worksheet.getCell('A6').value = 'Ngày:';
worksheet.getCell('G6').value = DateTime.now().toFormat('dd/MM/yyyy');
worksheet.getCell('E6').value = 'Ngày:';
worksheet.getCell('H6').value = 'Ngày:';

    // ===== DATA HEADER (Row 7) =====
    const exportColumns = [
      { header: 'TT', field: 'TT', width: 10 },
      { header: 'Tên vật tư', field: 'GroupMaterial', width: 35 },
      { header: 'Mã thiết bị', field: 'ProductCode', width: 18 },
      { header: 'Mã đặt hàng', field: 'BillCodePurchase', width: 18 },
      { header: 'Hãng SX', field: 'Manufacturer', width: 15 },
      { header: 'Thông số kỹ thuật', field: 'Model', width: 30 },
      { header: 'Số lượng/1 máy', field: 'QtyMin', width: 15, isNumber: true },
      { header: 'Số lượng tổng', field: 'QtyFull', width: 15, isNumber: true },
      { header: 'Đơn vị', field: 'Unit', width: 10 },
      { header: 'Đơn giá KT nhập', field: 'Price', width: 15, isNumber: true },
      { header: 'Thành tiền KT nhập', field: 'Amount', width: 18, isNumber: true },
      { header: 'Tiến độ', field: 'LeadTime', width: 15 },
      { header: 'Nhà cung cấp', field: 'NameNCCPriceQuote', width: 20 },
      { header: 'Ngày yêu cầu đặt hàng', field: 'RequestDate', width: 20, isDate: true },
      { header: 'Tiến độ yêu cầu', field: 'LeadTimePurchase', width: 18 },  
      { header: 'SL đặt thực tế', field: 'QtyOrderActual', width: 15, isNumber: true },
      { header: 'NCC mua hàng', field: 'SupplierNamePurchase', width: 18 },
      { header: 'Giá đặt mua', field: 'PriceOrder', width: 15, isNumber: true },
      { header: 'Ngày đặt hàng thực tế', field: 'RequestDatePurchase', width: 18, isDate: true },
      { header: 'Dự kiến hàng về', field: 'ExpectedReturnDate', width: 18, isDate: true },
      { header: 'Tình trạng', field: 'StatusText', width: 12 },
      { header: 'Chất lượng', field: 'Quality', width: 12 },
      { header: 'Note', field: 'Note', width: 20 },
      { header: 'Lý do phát sinh', field: 'ReasonProblem', width: 20 },
      { header: 'Mã đặc biệt', field: 'SpecialCode', width: 15 },
      { header: 'Đơn giá Pur báo', field: 'UnitPriceQuote', width: 15, isNumber: true },
      { header: 'Thành tiền Pur báo', field: 'TotalPriceQuote1', width: 18, isNumber: true },
      { header: 'Loại tiền Pur báo', field: 'CurrencyQuote', width: 18 },
      { header: 'Tỷ giá báo', field: 'CurrencyRateQuote', width: 12, isNumber: true },
      { header: 'Thành tiền quy đổi báo giá (VNĐ)', field: 'TotalPriceExchangeQuote', width: 25, isNumber: true },
      { header: 'Đơn giá Pur mua', field: 'UnitPricePurchase', width: 18, isNumber: true },
      { header: 'Thành tiền Pur mua', field: 'TotalPricePurchase', width: 18, isNumber: true },
      { header: 'Loại tiền Pur mua', field: 'CurrencyPurchase', width: 18 },
      { header: 'Tỷ giá mua', field: 'CurrencyRatePurchase', width: 12, isNumber: true },
      { header: 'Thành tiền quy đổi mua (VNĐ)', field: 'TotalPriceExchangePurchase', width: 25, isNumber: true },
      { header: 'Leadtime Pur báo giá', field: 'LeadTimeQuote', width: 20 },
      
      { header: 'Leadtime Pur đặt mua', field: 'LeadTimePurchase', width: 20 },
        { header: 'SL đã về', field: 'QuantityReturn', width: 12, isNumber: true },
      { header: 'Mã nội bộ', field: 'ProductNewCode', width: 15 },
      { header: 'Số HĐ đầu vào', field: 'SomeBill', width: 18 },
      { header: 'SL đã về', field: 'QuantityReturn', width: 12, isNumber: true },
      { header: 'SL đã xuất', field: 'TotalExport', width: 12, isNumber: true },
      { header: 'SL còn lại', field: 'RemainQuantity', width: 12, isNumber: true },
    ];

    // Set column widths
    worksheet.columns = exportColumns.map((col, index) => ({
      key: col.field,
      width: col.width,
    }));

    // Add header row (Row 7 - tự động là row 7 vì đã có 6 dòng trước đó)
    const headerRowData = exportColumns.map((col) => col.header);
    const excelHeaderRow = worksheet.addRow(headerRowData);
    excelHeaderRow.eachCell((cell) => {
      cell.font = { bold: true, size: 10 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }, // Light grey background
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });

    // Add data rows
    data.forEach((row: any, rowIndex: number) => {
      const rowData = exportColumns.map((col) => {
        let value = row[col.field];

        // Format dates
        if (col.isDate && value) {
          const dateTime = DateTime.fromISO(value);
          value = dateTime.isValid ? dateTime.toFormat('dd/MM/yyyy') : '';
        }

        // Format numbers
        if (col.isNumber && value !== null && value !== undefined && value !== '') {
          const num = parseFloat(value);
          if (!isNaN(num)) {
            value = num;
          } else {
            value = '';
          }
        }

        return value ?? '';
      });

      const excelRow = worksheet.addRow(rowData);

      // Style data rows
      excelRow.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.alignment = { vertical: 'middle', wrapText: true };

        // Right-align number columns
        const colDef = exportColumns[colNumber - 1];
        if (colDef && colDef.isNumber) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          if (typeof cell.value === 'number') {
            cell.numFmt = '#,##0.00';
          }
        }
      });
      excelRow.eachCell((cell, colNumber) => {
        const colDef = exportColumns[colNumber - 1];
        cell.alignment = {
          vertical: 'middle',
          wrapText: true,
          horizontal: colDef?.isNumber ? 'right' : 'left'
        };
      });

      // Highlight group rows (rows without TT or with parent indicator)
      if (!row.TT || (row._children && row._children.length > 0)) {
        excelRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF00' }, // Yellow background for group rows
          };
        });
      }
    });

    // Generate and download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const formattedDate = new Date()
      .toISOString()
      .slice(2, 10)
      .split('-')
      .reverse()
      .join('');

    const fileName = `DanhMucVatTu_${this.projectCode || 'Export'}_${formattedDate}.xlsx`;

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);

    this.notification.success(
      'Thành công',
      'Xuất Excel thành công!'
    );

    // Đóng modal sau khi xuất Excel thành công
    this.activeModal.close();
  }
}
