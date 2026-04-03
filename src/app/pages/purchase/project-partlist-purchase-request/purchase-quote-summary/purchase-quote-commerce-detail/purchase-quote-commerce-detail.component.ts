import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommercialPriceRequestComponent } from '../commercial-price-request/commercial-price-request.component';

@Component({
  selector: 'app-purchase-quote-commerce-detail',
  standalone: true,
  imports: [CommercialPriceRequestComponent],
  templateUrl: './purchase-quote-commerce-detail.component.html',
  styleUrl: './purchase-quote-commerce-detail.component.css'
})
export class PurchaseQuoteCommerceDetailComponent {
  @Input() dateStart: string | null = null;
  @Input() dateEnd: string | null = null;
  @Input() employeeId: number | null = null;

  constructor(public activeModal: NgbActiveModal) {}
}
