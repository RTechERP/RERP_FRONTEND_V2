import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewPokhPrimengComponent } from './view-pokh-primeng.component';

describe('ViewPokhPrimengComponent', () => {
    let component: ViewPokhPrimengComponent;
    let fixture: ComponentFixture<ViewPokhPrimengComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ViewPokhPrimengComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ViewPokhPrimengComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
