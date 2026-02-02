import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiEmployeeTeamComponent } from './kpi-employee-team.component';

describe('KpiEmployeeTeamComponent', () => {
  let component: KpiEmployeeTeamComponent;
  let fixture: ComponentFixture<KpiEmployeeTeamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiEmployeeTeamComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KpiEmployeeTeamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
