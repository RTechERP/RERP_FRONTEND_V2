import { Component, OnInit, Input, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BillImportDetailComponent } from '../bill-import-detail/bill-import-detail.component';

interface TabData {
  groupID: number;
  groupName: string;
  dataHistory: any[];
}

@Component({
  selector: 'app-bill-import-tabs',
  standalone: true,
  imports: [
    CommonModule,
    NgbModule,
    NzTabsModule,
    NzIconModule,
    NzButtonModule,
    BillImportDetailComponent
  ],
  templateUrl: './bill-import-tabs.component.html',
  styleUrl: './bill-import-tabs.component.css',
})
export class BillImportTabsComponent implements OnInit {
  @Input() tabs: TabData[] = [];
  @Input() createImport: boolean = true;
  @Input() billType: number = 1;

  @ViewChildren(BillImportDetailComponent) billImportDetails!: QueryList<BillImportDetailComponent>;

  selectedIndex: number = 0;

  constructor(
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
  }

  onTabChange(index: number): void {
    this.selectedIndex = index;
  }

  saveTabData(tabIndex: number): void {
    // Lấy component instance của tab hiện tại
    const detailComponents = this.billImportDetails.toArray();

    if (detailComponents[tabIndex]) {
      // Gọi phương thức save của bill-import-detail
      detailComponents[tabIndex].saveDataBillImport();
    }
  }

  onTabSaveSuccess(tabIndex: number): void {

    // Xóa tab đã lưu thành công
    this.tabs.splice(tabIndex, 1);

    // Nếu không còn tab nào, đóng modal
    if (this.tabs.length === 0) {
      this.notification.success('Thông báo', 'Đã hoàn thành tất cả các phiếu trả!');
      this.closeModal();
      return;
    }

    // Điều chỉnh selectedIndex nếu cần
    if (this.selectedIndex >= this.tabs.length) {
      this.selectedIndex = this.tabs.length - 1;
    }
  }

  closeModal(): void {
    this.activeModal.close();
  }

  onChildModalClose(tabIndex: number): void {
    // Có thể xử lý logic khi một tab hoàn thành
  }
}
