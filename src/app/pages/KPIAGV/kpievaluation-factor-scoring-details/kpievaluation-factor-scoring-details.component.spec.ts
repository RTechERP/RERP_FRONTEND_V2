import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KPIAGVEvaluationFactorScoringDetailsComponent } from './kpievaluation-factor-scoring-details.component';

describe('KPIAGVEvaluationFactorScoringDetailsComponent', () => {
  let component: KPIAGVEvaluationFactorScoringDetailsComponent;
  let fixture: ComponentFixture<KPIAGVEvaluationFactorScoringDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KPIAGVEvaluationFactorScoringDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KPIAGVEvaluationFactorScoringDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

