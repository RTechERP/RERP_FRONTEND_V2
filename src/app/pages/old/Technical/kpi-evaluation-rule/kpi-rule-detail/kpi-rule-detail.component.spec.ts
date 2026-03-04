import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiRuleDetailComponent } from './kpi-rule-detail.component';

describe('KpiRuleDetailComponent', () => {
    let component: KpiRuleDetailComponent;
    let fixture: ComponentFixture<KpiRuleDetailComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [KpiRuleDetailComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(KpiRuleDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
