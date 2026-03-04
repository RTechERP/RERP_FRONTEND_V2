import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiEvaluationFactorsComponent } from './kpi-evaluation-factors.component';

describe('KpiEvaluationFactorsComponent', () => {
  let component: KpiEvaluationFactorsComponent;
  let fixture: ComponentFixture<KpiEvaluationFactorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiEvaluationFactorsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KpiEvaluationFactorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
