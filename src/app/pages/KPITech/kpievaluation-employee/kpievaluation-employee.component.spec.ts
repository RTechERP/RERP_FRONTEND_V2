import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KPIEvaluationEmployeeComponent } from './kpievaluation-employee.component';

describe('KPIEvaluationEmployeeComponent', () => {
  let component: KPIEvaluationEmployeeComponent;
  let fixture: ComponentFixture<KPIEvaluationEmployeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KPIEvaluationEmployeeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KPIEvaluationEmployeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
