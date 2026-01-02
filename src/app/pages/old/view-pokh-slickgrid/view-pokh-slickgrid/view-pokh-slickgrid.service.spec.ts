import { TestBed } from '@angular/core/testing';

import { ViewPokhSlickgridService } from './view-pokh-slickgrid.service';

describe('ViewPokhSlickgridService', () => {
    let service: ViewPokhSlickgridService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ViewPokhSlickgridService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
