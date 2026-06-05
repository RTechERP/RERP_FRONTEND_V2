import { Component, ViewChild } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { BillImportSyntheticAllComponent } from '../bill-import-synthetic-all/bill-import-synthetic-all.component';
import { BillImportTechnicalSummaryComponent } from '../../../../bill-export-technical/bill-import-technical-summary/bill-import-technical-summary.component';

@Component({
  selector: 'app-bill-import-summary',
  standalone: true,
  imports: [NzTabsModule, NzSpinModule, BillImportSyntheticAllComponent, BillImportTechnicalSummaryComponent],
  templateUrl: './bill-import-summary.component.html'
})
export class BillImportSummaryComponent {
  selectedTabIndex = 0;

  @ViewChild('syntheticAll') syntheticAll?: BillImportSyntheticAllComponent;
  @ViewChild('techSummary') techSummary?: BillImportTechnicalSummaryComponent;

}
