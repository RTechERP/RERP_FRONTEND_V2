import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiErrorEmployeeComponent } from './kpi-error-employee.component';

describe('KpiErrorEmployeeComponent', () => {
  let component: KpiErrorEmployeeComponent;
  let fixture: ComponentFixture<KpiErrorEmployeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiErrorEmployeeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KpiErrorEmployeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
