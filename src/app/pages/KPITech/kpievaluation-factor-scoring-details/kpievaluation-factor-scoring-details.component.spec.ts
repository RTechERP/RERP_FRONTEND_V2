import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KPIEvaluationFactorScoringDetailsComponent } from './kpievaluation-factor-scoring-details.component';

describe('KPIEvaluationFactorScoringDetailsComponent', () => {
  let component: KPIEvaluationFactorScoringDetailsComponent;
  let fixture: ComponentFixture<KPIEvaluationFactorScoringDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KPIEvaluationFactorScoringDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KPIEvaluationFactorScoringDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
