import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewPokhSlickgridComponent } from './view-pokh-slickgrid.component';

describe('ViewPokhSlickgridComponent', () => {
    let component: ViewPokhSlickgridComponent;
    let fixture: ComponentFixture<ViewPokhSlickgridComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ViewPokhSlickgridComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ViewPokhSlickgridComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
