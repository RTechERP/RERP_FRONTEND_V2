import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiPositionEmployeeDetailComponent } from './kpi-position-employee-detail.component';

describe('KpiPositionEmployeeDetailComponent', () => {
  let component: KpiPositionEmployeeDetailComponent;
  let fixture: ComponentFixture<KpiPositionEmployeeDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiPositionEmployeeDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KpiPositionEmployeeDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
