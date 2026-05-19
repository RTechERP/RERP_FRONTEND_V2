import { TestBed } from '@angular/core/testing';

import { ViewPokhPrimengService } from './view-pokh-primeng.service';

describe('ViewPokhPrimengService', () => {
    let service: ViewPokhPrimengService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ViewPokhPrimengService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
