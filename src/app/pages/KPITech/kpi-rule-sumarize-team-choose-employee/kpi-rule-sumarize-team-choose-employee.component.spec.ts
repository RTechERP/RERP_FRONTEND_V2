import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiRuleSumarizeTeamChooseEmployeeComponent } from './kpi-rule-sumarize-team-choose-employee.component';

describe('KpiRuleSumarizeTeamChooseEmployeeComponent', () => {
  let component: KpiRuleSumarizeTeamChooseEmployeeComponent;
  let fixture: ComponentFixture<KpiRuleSumarizeTeamChooseEmployeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiRuleSumarizeTeamChooseEmployeeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KpiRuleSumarizeTeamChooseEmployeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
