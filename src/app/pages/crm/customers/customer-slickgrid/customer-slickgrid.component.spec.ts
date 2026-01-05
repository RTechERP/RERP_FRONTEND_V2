import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerSlickgridComponent } from './customer-slickgrid.component';

describe('CustomerSlickgridComponent', () => {
    let component: CustomerSlickgridComponent;
    let fixture: ComponentFixture<CustomerSlickgridComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CustomerSlickgridComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(CustomerSlickgridComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
