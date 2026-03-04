import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiEvaluationFactorsDetailComponent } from './kpi-evaluation-factors-detail.component';

describe('KpiEvaluationFactorsDetailComponent', () => {
    let component: KpiEvaluationFactorsDetailComponent;
    let fixture: ComponentFixture<KpiEvaluationFactorsDetailComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [KpiEvaluationFactorsDetailComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(KpiEvaluationFactorsDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
