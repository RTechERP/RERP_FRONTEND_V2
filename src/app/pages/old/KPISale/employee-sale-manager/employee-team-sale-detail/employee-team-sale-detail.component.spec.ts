import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeTeamSaleDetailComponent } from './employee-team-sale-detail.component';

describe('EmployeeTeamSaleDetailComponent', () => {
  let component: EmployeeTeamSaleDetailComponent;
  let fixture: ComponentFixture<EmployeeTeamSaleDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeTeamSaleDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeTeamSaleDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
