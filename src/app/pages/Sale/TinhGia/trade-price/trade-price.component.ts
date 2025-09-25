import { Component, ViewEncapsulation, ViewChild, TemplateRef, ElementRef, Input, IterableDiffers } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { NzUploadModule, NzUploadFile, NzUploadXHRArgs } from 'ng-zorro-antd/upload';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { TabulatorFull as Tabulator, RowComponent, CellComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { OnInit, AfterViewInit } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';

import { TradePriceDetailComponent } from '../trade-price-detail/trade-price-detail.component';
import { RequestInvoiceDetailService } from '../../../request-invoice-detail/request-invoice-detail-service/request-invoice-detail-service.service';
import { CustomerPartService } from '../../../customer-part/customer-part/customer-part.service';
import { TradePriceService } from './trade-price/trade-price.service';
@Component({
  selector: 'app-trade-price',
  imports: [
    NzCardModule,
    FormsModule,
    ReactiveFormsModule,
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
    NzInputNumberModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NzModalModule,
    NzUploadModule,
    NzSwitchModule,
    NzCheckboxModule,
    CommonModule,
  ],
  templateUrl: './trade-price.component.html',
  styleUrl: './trade-price.component.css'
})
export class TradePriceComponent implements OnInit, AfterViewInit {
  @ViewChild('tb_MainTable', { static: false }) tb_MainTableElement!: ElementRef;
  @ViewChild('tb_Detail', { static: false }) tb_DetailTableElement!: ElementRef;

  private tb_MainTable!: Tabulator;
  private tb_Detail!: Tabulator;

  sizeSearch: string = '0';
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  filterEmployeeData: any[] = [];
  filterProjectData: any[] = [];
  filterCustomerData: any[] = [];
  dataDetail: any[] = [];
  mainData: any[] = [];
  selectedId: number = 0;
  selectedRow: any = null;
  selectedRows: any[] = [];

  filters: any = {
    employeeId: 0,
    saleAdminId: 0,
    projectId: 0,
    customerId: 0,
    keyword: '',
  };

  constructor(
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private modal: NzModalService,
    private RIDService: RequestInvoiceDetailService,
    private customerPartService: CustomerPartService,
    private tradePriceService: TradePriceService,
  ) { }
  ngOnInit(): void {
    this.loadEmployee(),
      this.loadProject(),
      this.loadCustomer()


  }
  ngAfterViewInit(): void {
    this.initMainTable();
    this.initDetailTable();
    setTimeout(() => {
      this.loadTradePrice(this.filters.employeeId, this.filters.saleAdminId, this.filters.projectId, this.filters.customerId, this.filters.keyword)
      if (this.tb_MainTable && this.mainData.length > 0) {
        this.tb_MainTable.setData(this.mainData);
      }
    }, 1);
  }

  loadEmployee() {
    this.RIDService.loadEmployee().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.filterEmployeeData = response.data;
        } else {
          this.notification.error('Lỗi', response.message);
        }
      },
      error: (error) => {
        this.notification.error('Lỗi', error);
      }
    });
  }
  loadProject() {
    this.RIDService.loadProject().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.filterProjectData = response.data;
        } else {
          this.notification.error('Lỗi', response.message);
        }
      },
      error: (error) => {
        this.notification.error('Lỗi', error);
      }
    });
  }
  loadCustomer() {
    this.customerPartService.getCustomer().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.filterCustomerData = response.data;
        } else {
          this.notification.error('Lỗi', response.message);
        }
      },
      error: (error) => {
        this.notification.error('Lỗi', error);
      }
    });
  }

  loadTradePrice(employeeId: number, saleAdminId: number, projectId: number, customerId: number, keyword: string) {
    this.tradePriceService.getTradePrice(employeeId, saleAdminId, projectId, customerId, keyword).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.mainData = response.data;
          if (this.tb_MainTable) {
            this.tb_MainTable.setData(this.mainData);
          }
        } else {
          this.notification.error('Lỗi', response.message);
        }
      },
      error: (error) => {
        this.notification.error('Lỗi', error);
      }
    });
  }

  loadTradePriceDetail(id: number) {
    this.tradePriceService.getTradePriceDetail(id).subscribe({
      next: (response) => {
        if (response.status === 1) {
          const flatData = response.data;
          const treeData = this.convertToTreeData(flatData);
          this.dataDetail = treeData;
          if (this.tb_Detail) {
            this.tb_Detail.setData(this.dataDetail);
          }
        } else {
          this.notification.error('Lỗi', response.message);
        }
      },
      error: (error) => {
        this.notification.error('Lỗi', error);
      }
    });
  }
  //#region Xử lý sự kiện
  openModal() {
    const modalRef = this.modalService.open(TradePriceDetailComponent, {
      centered: true,
      windowClass: 'full-screen-modal',
      // size: "xl",
      backdrop: 'static',
    });

    modalRef.result.then(
      (result) => {
        if (result.success && result.reloadData) {
          this.loadTradePrice(this.filters.employeeId, this.filters.saleAdminId, this.filters.projectId, this.filters.customerId, this.filters.keyword)
        }
      },
      (reason) => {
        console.log('Modal closed');
      }
    );
  }
  onEdit() {
    if (!this.selectedId) {
      this.notification.error("Lỗi", "Vui lòng chọn bản ghi cần sửa")
      return;
    }

    this.tradePriceService.getTradePriceDetail(this.selectedId).subscribe({
      next: (response) => {
        if (response.status === 1) {
          const DetailDATA = response.data;
          const MainData = this.mainData.find(item => item.ID === this.selectedId);
          const groupedData = [{
            MainData: MainData,
            ID: this.selectedId,
            items: DetailDATA,
          }];
          const modalRef = this.modalService.open(TradePriceDetailComponent, {
            centered: true,
            windowClass: 'full-screen-modal',
            backdrop: 'static'
          });
          modalRef.componentInstance.groupedData = groupedData;
          modalRef.componentInstance.isEditMode = true;
          modalRef.result.then(
            (result) => {
              if (result.success && result.reloadData) {
                this.loadTradePrice(this.filters.employeeId, this.filters.saleAdminId, this.filters.projectId, this.filters.customerId, this.filters.keyword)
              }
            },
            (reason) => {
              console.log('Modal closed');
            }
          );
        } else {
          this.notification.error('Lỗi', response.message);
        }
      },
      error: (error) => {
        this.notification.error('Lỗi', error);
      }
    });
  }
  onDelete() {
    if (!this.selectedId) {
      this.notification.error("Thông báo!", "Vui lòng chọn yêu cầu cần xóa!");
      return;
    }
    this.modal.confirm({
      nzTitle: 'Bạn có chắc chắn muốn xóa?',
      nzContent: 'Hành động này không thể hoàn tác.',
      nzOkText: 'Xóa',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const DATA = {
          ID: this.selectedId,
          IsDeleted: true
        }

        this.tradePriceService.saveData({
          tradePrices: DATA,
          tradePriceDetails: [],
          deletedTradePriceDetails: []
        }).subscribe({
          next: (response) => {
            if (response.status === 1) {
              this.notification.success('Thành công', 'Xóa dữ liệu thành công');
              this.loadTradePrice(this.filters.employeeId, this.filters.saleAdminId, this.filters.projectId, this.filters.customerId, this.filters.keyword)
            } else {
              this.notification.error('Lỗi', response.message || 'Xóa dữ liệu thất bại!');
            }
          },
          error: (err) => {
            this.notification.error('Lỗi', 'Không thể xóa dữ liệu!');
          }
        });
      }
    })
  }
  onSaleApprovedAndRequest(isApprove: number) {
    if (this.selectedRows.length < 1) {
      this.notification.error('Thông báo!', 'Vui lòng chọn ít nhất 1 dự án cần thay đổi trạng thái!');
      return;
    }

    const actionText = isApprove === 1 ? 'CHỐT' : isApprove === 2 ? 'HỦY CHỐT' : 'YÊU CẦU DUYỆT';
    const confirmMessage = `Bạn có chắc muốn ${actionText} cho ${this.selectedRows.length} dự án đã chọn?`;

    this.modal.confirm({
      nzTitle: 'Xác nhận thay đổi trạng thái',
      nzContent: confirmMessage,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const requests = this.selectedRows.map((row: any) => {
          if (isApprove === 1 && row.IsApprovedSale === 1) {
            return of({ row, status: 'skipped', reason: 'Dự án đã được chốt' });
          }
          if (isApprove === 2 && row.IsApprovedSale === 2) {
            return of({ row, status: 'skipped', reason: 'Dự án đã được HỦY chốt' });
          }
          if (isApprove === 3) {
            if (row.IsApprovedSale === 3) {
              return of({ row, status: 'skipped', reason: 'Dự án đã được yêu cầu duyệt' });
            }
            if (row.IsApprovedSale === 0 || row.IsApprovedSale === 2) {
              return of({ row, status: 'skipped', reason: 'Dự án chưa được chốt nên không thể yêu cầu duyệt' });
            }
          }
          if(row.IsApprovedSale === 3 && (isApprove === 2 || isApprove === 1))
          {
            return of({ row, status: 'skipped', reason: 'Dự án đã được yêu cầu duyệt, không thể thay đổi trạng thái' });
          }

          const DATA = { ID: row.ID, IsApprovedSale: isApprove };
          return this.tradePriceService
            .saveData({ tradePrices: DATA, tradePriceDetails: [], deletedTradePriceDetails: [] })
            .pipe(
              map((response: any) => ({ row, status: response.status === 1 ? 'success' : 'failed', message: response.message })),
              catchError(() => of({ row, status: 'failed', message: 'Không thể cập nhật dữ liệu!' }))
            );
        });

        forkJoin(requests).subscribe((results: any[]) => {
          const success = results.filter(r => r.status === 'success');
          const skipped = results.filter(r => r.status === 'skipped');
          const failed = results.filter(r => r.status === 'failed');

          if (success.length > 0) {
            this.notification.success('Thành công', `Cập nhật thành công ${success.length} dự án.`);
          }
          if (skipped.length > 0) {
            const skippedDetails = skipped
              .map((r: any) => `${r.row?.ProjectCode || r.row?.ID}: ${r.reason}`)
              .join('; ');
            this.notification.error('Lỗi', `Bỏ qua ${skipped.length} dự án lí do: ${skippedDetails}`);
          }
          if (failed.length > 0) {
            const failedDetails = failed
              .map((r: any) => `${r.row?.ProjectCode || r.row?.ID}: ${r.message || 'Không thể cập nhật dữ liệu!'}`)
              .join('; ');
            this.notification.error('Lỗi', `Cập nhật thất bại ${failed.length} dự án lí do: ${failedDetails}`);
          }

          this.loadTradePrice(this.filters.employeeId, this.filters.saleAdminId, this.filters.projectId, this.filters.customerId, this.filters.keyword
          );
        });
      }
    });
  }
  onLeaderApproved(isApprove: number) {
    if (this.selectedRows.length < 1) {
      this.notification.error('Thông báo!', 'Vui lòng chọn ít nhất 1 dự án cần thay đổi trạng thái!');
      return;
    }

    const actionText = isApprove === 1 ? 'DUYỆT' : isApprove === 2 ? 'HỦY DUYỆT' : 'YÊU CẦU BGĐ DUYỆT';
    const confirmMessage = `Bạn có chắc muốn ${actionText} cho ${this.selectedRows.length} dự án đã chọn?`;

    this.modal.confirm({
      nzTitle: 'Xác nhận thay đổi trạng thái',
      nzContent: confirmMessage,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const requests = this.selectedRows.map((row: any) => {
          if ((isApprove === 1 || isApprove === 2) && row.IsApprovedLeader === 3 && (row.IsApprovedBGD === 0 || row.IsApprovedBGD === 1)) {
            return of({ row, status: 'skipped', reason: 'Dự án đang chờ BGĐ duyệt, không thể thay đổi trạng thái' });
          }
          if (isApprove === 1 && row.IsApprovedLeader === 1) {
            return of({ row, status: 'skipped', reason: 'Dự án đã được duyệt rồi' });
          }
          if (isApprove === 2 && row.IsApprovedLeader === 2) {
            return of({ row, status: 'skipped', reason: 'Dự án đã được hủy duyệt rồi' });
          }
          if (isApprove === 3) {
            if (row.IsApprovedLeader === 3) {
              return of({ row, status: 'skipped', reason: 'Dự án đã được yêu cầu duyệt' });
            }
          }
          let valueIsApprovedBGD = 0;
          const DATA = { ID: row.ID, IsApprovedLeader: isApprove , IsApprovedBGD: valueIsApprovedBGD };

          if ((isApprove === 1 || isApprove === 2) && row.IsApprovedBGD != 1)
          {
            DATA.IsApprovedBGD = isApprove;
          }
          else if(isApprove === 3)
          {
            DATA.IsApprovedBGD = 0
          }

          return this.tradePriceService
            .saveData({ tradePrices: DATA, tradePriceDetails: [], deletedTradePriceDetails: [] })
            .pipe(
              map((response: any) => ({ row, status: response.status === 1 ? 'success' : 'failed', message: response.message })),
              catchError(() => of({ row, status: 'failed', message: 'Không thể cập nhật dữ liệu!' }))
            );
        });

        forkJoin(requests).subscribe((results: any[]) => {
          const success = results.filter(r => r.status === 'success');
          const skipped = results.filter(r => r.status === 'skipped');
          const failed = results.filter(r => r.status === 'failed');

          if (success.length > 0) {
            this.notification.success('Thành công', `Cập nhật thành công ${success.length} dự án.`);
          }
          if (skipped.length > 0) {
            const skippedDetails = skipped
              .map((r: any) => `${r.row?.ProjectCode || r.row?.ID}: ${r.reason}`)
              .join('; ');
            this.notification.error('Lỗi', `Bỏ qua ${skipped.length} dự án lí do: ${skippedDetails}`);
          }
          if (failed.length > 0) {
            const failedDetails = failed
              .map((r: any) => `${r.row?.ProjectCode || r.row?.ID}: ${r.message || 'Không thể cập nhật dữ liệu!'}`)
              .join('; ');
            this.notification.error('Lỗi', `Cập nhật thất bại ${failed.length} dự án lí do: ${failedDetails}`);
          }

          this.loadTradePrice(this.filters.employeeId, this.filters.saleAdminId, this.filters.projectId, this.filters.customerId, this.filters.keyword
          );
        });
      }
    });
  }
  onBGDApproved(isApprove: number) {
    if (this.selectedRows.length < 1) {
      this.notification.error('Thông báo!', 'Vui lòng chọn ít nhất 1 dự án cần thay đổi trạng thái!');
      return;
    }

    const actionText = isApprove === 1 ? 'DUYỆT' : 'HỦY DUYỆT';
    const confirmMessage = `Bạn có chắc muốn ${actionText} cho ${this.selectedRows.length} dự án đã chọn?`;

    this.modal.confirm({
      nzTitle: 'Xác nhận thay đổi trạng thái',
      nzContent: confirmMessage,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const requests = this.selectedRows.map((row: any) => {
          if ((isApprove === 1 || isApprove === 2) && row.IsApprovedBGD === 3 && row.IsApprovedBGD === 0) {
            return of({ row, status: 'skipped', reason: 'Dự án đang chờ BGĐ duyệt, không thể thay đổi trạng thái' });
          }
          if (isApprove === 1 && row.IsApprovedBGD === 1) {
            return of({ row, status: 'skipped', reason: 'Dự án đã được duyệt rồi' });
          }
          if (isApprove === 2 && row.IsApprovedBGD === 2) {
            return of({ row, status: 'skipped', reason: 'Dự án đã được hủy duyệt rồi' });
          }

          let valueIsApprovedLeader = 3;
          const DATA = { ID: row.ID, IsApprovedBGD: isApprove, IsApprovedLeader: valueIsApprovedLeader };

          if ((isApprove === 2 || isApprove === 1) && row.IsApprovedLeader != 3 ){ DATA.IsApprovedLeader = isApprove; }
          
          return this.tradePriceService
            .saveData({ tradePrices: DATA, tradePriceDetails: [], deletedTradePriceDetails: [] })
            .pipe(
              map((response: any) => ({ row, status: response.status === 1 ? 'success' : 'failed', message: response.message })),
              catchError(() => of({ row, status: 'failed', message: 'Không thể cập nhật dữ liệu!' }))
            );
        });

        forkJoin(requests).subscribe((results: any[]) => {
          const success = results.filter(r => r.status === 'success');
          const skipped = results.filter(r => r.status === 'skipped');
          const failed = results.filter(r => r.status === 'failed');

          if (success.length > 0) {
            this.notification.success('Thành công', `Cập nhật thành công ${success.length} dự án.`);
          }
          if (skipped.length > 0) {
            const skippedDetails = skipped
              .map((r: any) => `${r.row?.ProjectCode || r.row?.ID}: ${r.reason}`)
              .join('; ');
            this.notification.error('Lỗi', `Bỏ qua ${skipped.length} dự án lí do: ${skippedDetails}`);
          }
          if (failed.length > 0) {
            const failedDetails = failed
              .map((r: any) => `${r.row?.ProjectCode || r.row?.ID}: ${r.message || 'Không thể cập nhật dữ liệu!'}`)
              .join('; ');
            this.notification.error('Lỗi', `Cập nhật thất bại ${failed.length} dự án lí do: ${failedDetails}`);
          }

          this.loadTradePrice(this.filters.employeeId, this.filters.saleAdminId, this.filters.projectId, this.filters.customerId, this.filters.keyword
          );
        });
      }
    });
  }
  searchData(): void {
    this.loadTradePrice(this.filters.employeeId, this.filters.saleAdminId, this.filters.projectId, this.filters.customerId, this.filters.keyword)
  }
  private convertToTreeData(flatData: any[]): any[] {
    const treeData: any[] = [];
    const map = new Map();

    // Đầu tiên, tạo map với key là ID của mỗi item
    flatData.forEach(item => {
      map.set(item.ID, { ...item, _children: [] });
    });

    // Sau đó, xây dựng cấu trúc cây
    flatData.forEach(item => {
      const node = map.get(item.ID);
      if (item.ParentID === 0 || item.ParentID === null) {
        // Nếu là node gốc (không có parent)
        treeData.push(node);
      } else {
        // Nếu là node con, thêm vào mảng _children của parent
        const parent = map.get(item.ParentID);
        if (parent) {
          parent._children.push(node);
        }
      }
    });

    return treeData;
  }
  //#endregion
  initMainTable(): void {
    this.tb_MainTable = new Tabulator(this.tb_MainTableElement.nativeElement, {
      data: this.mainData,
      layout: 'fitDataFill',
      height: '100%',
      selectableRows: true,
      pagination: true,
      paginationSize: 50,
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: "center",
        minWidth: 60,
        resizable: true
      },
      rowHeader: {
        headerSort: false,
        resizable: false,
        frozen: true,
        formatter: "rowSelection",
        headerHozAlign: "center",
        hozAlign: "center",
        titleFormatter: "rowSelection",
        cellClick: (e, cell) => {
          e.stopPropagation();
        },
      },
      columns: [
        {
          title: 'Báo giá', field: 'IsQuotation', sorter: 'boolean', width: 80, formatter: (cell) => {
            const checked = cell.getValue() ? 'checked' : '';
            return `<div style="text-align: center;">
            <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
          </div>`;
          }
        },
        { title: 'Trạng thái Sale', field: 'approvedSale', sorter: 'string', width: 150 },
        {
          title: 'Leader duyệt', field: 'approvedLeader', sorter: 'boolean', width: 150
        },
        {
          title: 'BGD duyệt', field: 'approvedBGD', sorter: 'boolean', width: 100
        },
        { title: 'Mã dự án', field: 'ProjectCode', sorter: 'string', width: 100 },
        { title: 'Tên dự án', field: 'ProjectName', sorter: 'string', width: 150 },
        { title: 'Mã khách hàng', field: 'CustomerCode', sorter: 'string', width: 100 },
        { title: 'Tên khách hàng', field: 'CustomerName', sorter: 'string', width: 150 },
        { title: 'Sale Admin', field: 'SaleAdminName', sorter: 'string', width: 150 },
        { title: 'Sale phụ trách', field: 'FullName', sorter: 'string', width: 100 },
        { title: 'Ngày sale cập nhật', field: 'SaleApprovedDate', sorter: 'string', width: 150 },
        { title: 'Ngày leader duyệt', field: 'LeaderApprovedDate', sorter: 'string', width: 150 },
        { title: 'Ngày BGD duyệt', field: 'BGDApprovedDate', sorter: 'string', width: 150 },
        { title: 'TotalProfit2', field: 'TotalProfit2', sorter: 'string', width: 150, visible: false },
        { title: 'Margin', field: 'Margin', sorter: 'string', width: 150, visible: false },
        { title: 'TotalProfitPercent', field: 'TotalProfitPercent', sorter: 'string', width: 150, visible: false },
        { title: 'TotalCMPerSET', field: 'TotalCMPerSET', sorter: 'string', width: 150, visible: false },
        { title: 'EXW', field: 'EXW', sorter: 'string', width: 150, visible: false },

      ]
    });
    this.tb_MainTable.on('rowClick', (e: any, row: RowComponent) => {
      const ID = row.getData()['ID'];
      const rowData = row.getData();
      this.selectedId = ID;
      this.selectedRow = rowData;
      console.log("Dữ liệu dòng đã chọn", this.selectedRow)
      this.loadTradePriceDetail(ID);
      setTimeout(() => {
        if (this.tb_Detail) {
          const columns = this.tb_Detail.getColumnDefinitions();
          // Tìm đúng index cột group lợi nhuận, mặc định là index 3 (có thể cần chỉnh lại nếu vị trí khác)
          if (columns[3]) {
            columns[0].title = `Tổng CM/Set = ${this.formatMoney(this.selectedRow?.TotalCMPerSET)}`;
            columns[1].title = `EXW = ${this.formatMoney(this.selectedRow?.EXW)}`;
            columns[2].title = `Margin = ${this.formatMoney(this.selectedRow?.Margin)}`;
            columns[3].title = `Lợi nhuận = ${this.formatMoney(this.selectedRow?.TotalProfit2)}`;
            columns[4].title = `Tỷ lệ lợi nhuận = ${this.formatMoney(this.selectedRow?.TotalProfitPercent)}`;
            this.tb_Detail.setColumns(columns);
          }
        }
      }, 0);
    });

    this.tb_MainTable.on('rowSelectionChanged', (data: any[], rows: RowComponent[]) => {
      this.selectedRows = (data || []).map((item: any) => item)
      console.log('Danh sách ID đã chọn:', this.selectedRows);
    });
  }
  initDetailTable(): void {
    this.tb_Detail = new Tabulator(this.tb_DetailTableElement.nativeElement, {
      data: this.dataDetail,
      layout: 'fitDataFill',
      height: "90%",
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      dataTree: true,
      dataTreeStartExpanded: true,
      columns: [
        {
          title: "Tổng CM/Set",
          frozen: true,
          columns: [
            {
              title: "STT", field: "STT", width: 70, hozAlign: "center", resizable: true
            },
            {
              title: "Cụm", field: "Maker", width: 70, hozAlign: "center", resizable: true
            },
            {
              title: "Tên sản phẩm",
              field: "ProductName",
              width: 150,
              resizable: true,
              variableHeight: true,
            },
          ]
        },
        {
          title: "EXW",
          columns: [
            {
              title: "Mã gốc", field: "ProductCode", width: 150, hozAlign: "center", resizable: true
            },
          ]
        },
        {
          title: "Margin",
          columns: [
            { title: "Mã báo khách", field: "ProductCodeCustomer", width: 150, hozAlign: "center", resizable: true },
            {
              title: "Số lượng", field: "Quantity", width: 100, hozAlign: "center", resizable: true, formatter: "money",
              formatterParams: {
                precision: 0,
                decimal: ".",
                thousand: ",",
                symbol: "",
                symbolAfter: true
              },
              bottomCalc: "sum",
              bottomCalcFormatter: "money",
              bottomCalcFormatterParams: {
                precision: 0,
                decimal: ".",
                thousand: ",",
                symbol: "",
                symbolAfter: true
              }
            },
          ]
        },
        {
          title: `Lợi nhuận`,
          field: 'bandTotalProfit',
          columns: [
            { title: "ĐVT", field: "UnitCountID", width: 150, hozAlign: "center", resizable: true },
            {
              title: "Đơn giá nhập EXW", field: "UnitImportPriceUSD", width: 150, hozAlign: "center", resizable: true, formatter: "money",
              formatterParams: {
                precision: 0,
                decimal: ".",
                thousand: ",",
                symbol: "",
                symbolAfter: true
              },
              bottomCalc: "sum",
              bottomCalcFormatter: "money",
              bottomCalcFormatterParams: {
                precision: 0,
                decimal: ".",
                thousand: ",",
                symbol: "",
                symbolAfter: true
              }
            },
          ]
        },
        {
          title: "Tỷ lệ lợi nhuận",
          columns: [
            { title: "Loại tiền", field: "CurrencyCode", width: 150, hozAlign: "center", resizable: true },
            { title: "Tỷ giá", field: "CurrencyRate", width: 150, hozAlign: "center", resizable: true },
          ]
        },
        {
          title: 'Tổng giá nhập', field: 'TotalImportPriceUSD', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Đơn giá nhập chưa chi phí (VND)', field: 'UnitImportPriceVND', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Tổng giá nhập chưa chi phí (VND)', field: 'TotalImportPriceVND', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Phí ngân hàng (VND)', field: 'BankCharge', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Thuế nhập khẩu (%)', field: 'ProtectiveTariff', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Phí vận chuyển / 1pcs', field: 'FeeShipPcs', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Thuế nhập khẩu/1pcs (VND)', field: 'ProtectiveTariffPerPcs', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Tổng thuế nhập khẩu (VND)', field: 'TotalProtectiveTariff', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Phí vận chuyển, HCHQ, CO, MSDV, vv (VND)', field: 'OrtherFees', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Phí khai HQ (VND)', field: 'CustomFees', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Tổng giá nhập chưa VAT (VND)', field: 'TotalImportPriceIncludeFees', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Đơn giá về kho (Bao gồm chi phí)', field: 'UnitPriceIncludeFees', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'CM/Set', field: 'CMPerSet', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        { title: 'Margin', field: 'Margin', sorter: 'string', width: 150 },
        {
          title: 'Đơn giá dự kiến báo khách', field: 'UnitPriceExpectCustomer', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Tổng đơn hàng', field: 'TotalPriceExpectCustomer', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Lợi nhuận', field: 'Profit', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Tỷ lệ lợi nhuận', field: 'ProfitPercent', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        { title: 'Leadtime', field: 'LeadTime', sorter: 'string', width: 150 },
        {
          title: 'Giá báo nhân công', field: 'TotalPriceLabor', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Giá báo RTC Vision Software', field: 'TotalPriceRTCVision', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Tổng giá trị đầu ra đơn hàng', field: 'TotalPrice', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        {
          title: 'Đơn giá/Máy (Bao gồm nhân công và COM', field: 'UnitPricePerCOM', sorter: 'string', width: 150, formatter: "money",
          formatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          },
          bottomCalc: "sum",
          bottomCalcFormatter: "money",
          bottomCalcFormatterParams: {
            precision: 0,
            decimal: ".",
            thousand: ",",
            symbol: "",
            symbolAfter: true
          }
        },
        { title: 'Ghi chú', field: 'Note', sorter: 'string', width: 150 },
      ]
    });
  }
  // Hàm format tiền tệ
  formatMoney(value: any): string {
    if (value === null || value === undefined || isNaN(value)) return '';
    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number(value));
  }
}
