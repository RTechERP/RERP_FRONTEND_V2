import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestInvoiceSummarySlickgridComponent } from './request-invoice-summary-slickgrid.component';

describe('RequestInvoiceSummarySlickgridComponent', () => {
    let component: RequestInvoiceSummarySlickgridComponent;
    let fixture: ComponentFixture<RequestInvoiceSummarySlickgridComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RequestInvoiceSummarySlickgridComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(RequestInvoiceSummarySlickgridComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
