import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeBussinessSummaryComponent } from './employee-bussiness-summary.component';

describe('EmployeeBussinessSummaryComponent', () => {
  let component: EmployeeBussinessSummaryComponent;
  let fixture: ComponentFixture<EmployeeBussinessSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeBussinessSummaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeBussinessSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
