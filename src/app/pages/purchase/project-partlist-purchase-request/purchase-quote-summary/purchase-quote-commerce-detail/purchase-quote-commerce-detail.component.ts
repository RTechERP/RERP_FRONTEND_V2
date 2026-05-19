import { Component, Input, OnInit, Optional, Inject } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommercialPriceRequestComponent } from '../commercial-price-request/commercial-price-request.component';

@Component({
  selector: 'app-purchase-quote-commerce-detail',
  standalone: true,
  imports: [CommercialPriceRequestComponent, NgClass, NgIf],
  templateUrl: './purchase-quote-commerce-detail.component.html',
  styleUrl: './purchase-quote-commerce-detail.component.css'
})
export class PurchaseQuoteCommerceDetailComponent implements OnInit {
  @Input() dateStart: string | null = null;
  @Input() dateEnd: string | null = null;
  @Input() employeeId: number | null = null;

  constructor(
    @Optional() public activeModal: NgbActiveModal | null,
    @Optional() @Inject('tabData') public tabData?: any
  ) {}

  ngOnInit(): void {
    if (this.tabData) {
      this.dateStart = this.tabData.dateStart || this.dateStart;
      this.dateEnd = this.tabData.dateEnd || this.dateEnd;
      this.employeeId = this.tabData.employeeId || this.employeeId;
    }
  }
}
