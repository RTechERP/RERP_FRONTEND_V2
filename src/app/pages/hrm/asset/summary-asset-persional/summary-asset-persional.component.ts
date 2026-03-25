import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NzTabSetComponent, NzTabComponent } from 'ng-zorro-antd/tabs';
import { AssetPersonalComponent } from '../asset/asset-personal/asset-personal.component';
import { HistoryProductRtcPersonalComponent } from '../../../old/inventory-demo/borrow/borrow-product-history/history-product-rtc-personal/history-product-rtc-personal.component';
import { HistoryBorrowSalePersonalComponent } from '../../../old/Sale/HistoryBorrowSale/history-borrow-sale-personal/history-borrow-sale-personal.component';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

@Component({
  selector: 'app-summary-asset-persional',
  standalone: true,
  imports: [
    CommonModule,
    NzTabSetComponent,
    NzTabComponent,
    AssetPersonalComponent,
    HistoryProductRtcPersonalComponent,
    HistoryBorrowSalePersonalComponent,
    NzTabsModule
  ],
  templateUrl: './summary-asset-persional.component.html',
  styleUrl: './summary-asset-persional.component.css'
})
export class SummaryAssetPersionalComponent implements OnInit {
  activeTabIndex: number = 0;

  constructor(
    private route: ActivatedRoute,
    @Optional() @Inject('tabData') private tabData: any
  ) {}

  ngOnInit(): void {
    if (this.tabData?.activeTab != null) {
      this.activeTabIndex = Number(this.tabData.activeTab);
      return;
    }
    this.route.queryParams.subscribe(params => {
      if (params['activeTab']) {
        this.activeTabIndex = Number(params['activeTab']);
      }
    });
  }
}
