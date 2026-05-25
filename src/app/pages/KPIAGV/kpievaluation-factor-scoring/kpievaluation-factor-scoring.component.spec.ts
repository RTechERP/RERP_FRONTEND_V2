import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KPIAGVEvaluationFactorScoringComponent } from './kpievaluation-factor-scoring.component';

describe('KPIAGVEvaluationFactorScoringComponent', () => {
  let component: KPIAGVEvaluationFactorScoringComponent;
  let fixture: ComponentFixture<KPIAGVEvaluationFactorScoringComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KPIAGVEvaluationFactorScoringComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KPIAGVEvaluationFactorScoringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

