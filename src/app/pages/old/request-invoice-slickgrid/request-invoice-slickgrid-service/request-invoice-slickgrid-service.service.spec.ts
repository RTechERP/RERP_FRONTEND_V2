import { TestBed } from '@angular/core/testing';

import { RequestInvoiceSlickgridService } from './request-invoice-slickgrid-service.service';

describe('RequestInvoiceSlickgridService', () => {
    let service: RequestInvoiceSlickgridService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(RequestInvoiceSlickgridService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
