import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiSessionDetailComponent } from './kpi-session-detail.component';

describe('KpiSessionDetailComponent', () => {
    let component: KpiSessionDetailComponent;
    let fixture: ComponentFixture<KpiSessionDetailComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [KpiSessionDetailComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(KpiSessionDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
