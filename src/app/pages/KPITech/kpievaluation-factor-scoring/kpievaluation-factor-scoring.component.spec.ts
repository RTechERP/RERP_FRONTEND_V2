import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KPIEvaluationFactorScoringComponent } from './kpievaluation-factor-scoring.component';

describe('KPIEvaluationFactorScoringComponent', () => {
  let component: KPIEvaluationFactorScoringComponent;
  let fixture: ComponentFixture<KPIEvaluationFactorScoringComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KPIEvaluationFactorScoringComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KPIEvaluationFactorScoringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
