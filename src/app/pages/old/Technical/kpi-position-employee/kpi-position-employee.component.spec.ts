import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiPositionEmployeeComponent } from './kpi-position-employee.component';

describe('KpiPositionEmployeeComponent', () => {
  let component: KpiPositionEmployeeComponent;
  let fixture: ComponentFixture<KpiPositionEmployeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiPositionEmployeeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KpiPositionEmployeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
