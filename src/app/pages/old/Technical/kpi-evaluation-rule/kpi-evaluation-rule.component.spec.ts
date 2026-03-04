import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiEvaluationRuleComponent } from './kpi-evaluation-rule.component';

describe('KpiEvaluationRuleComponent', () => {
  let component: KpiEvaluationRuleComponent;
  let fixture: ComponentFixture<KpiEvaluationRuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiEvaluationRuleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KpiEvaluationRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
