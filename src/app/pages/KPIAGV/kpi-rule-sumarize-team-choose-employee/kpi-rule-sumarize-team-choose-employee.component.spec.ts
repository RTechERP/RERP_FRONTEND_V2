import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KPIAGVRuleSumarizeTeamChooseEmployeeComponent } from './kpi-rule-sumarize-team-choose-employee.component';

describe('KPIAGVRuleSumarizeTeamChooseEmployeeComponent', () => {
  let component: KPIAGVRuleSumarizeTeamChooseEmployeeComponent;
  let fixture: ComponentFixture<KPIAGVRuleSumarizeTeamChooseEmployeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KPIAGVRuleSumarizeTeamChooseEmployeeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KPIAGVRuleSumarizeTeamChooseEmployeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

