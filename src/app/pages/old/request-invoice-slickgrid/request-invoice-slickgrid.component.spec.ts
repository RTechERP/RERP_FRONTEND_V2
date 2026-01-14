import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestInvoiceSlickgridComponent } from './request-invoice-slickgrid.component';

describe('RequestInvoiceSlickgridComponent', () => {
    let component: RequestInvoiceSlickgridComponent;
    let fixture: ComponentFixture<RequestInvoiceSlickgridComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RequestInvoiceSlickgridComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(RequestInvoiceSlickgridComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
