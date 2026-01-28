import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiEvaluationRuleDetailComponent } from './kpi-evaluation-rule-detail.component';

describe('KpiEvaluationRuleDetailComponent', () => {
    let component: KpiEvaluationRuleDetailComponent;
    let fixture: ComponentFixture<KpiEvaluationRuleDetailComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [KpiEvaluationRuleDetailComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(KpiEvaluationRuleDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
