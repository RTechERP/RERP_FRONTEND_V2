import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KPIAGVEvaluationEmployeeComponent } from './kpievaluation-employee.component';

describe('KPIAGVEvaluationEmployeeComponent', () => {
  let component: KPIAGVEvaluationEmployeeComponent;
  let fixture: ComponentFixture<KPIAGVEvaluationEmployeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KPIAGVEvaluationEmployeeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KPIAGVEvaluationEmployeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

