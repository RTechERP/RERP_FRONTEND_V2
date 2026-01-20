import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiCriteriaDetailComponent } from './kpi-criteria-detail.component';

describe('KpiCriteriaDetailComponent', () => {
  let component: KpiCriteriaDetailComponent;
  let fixture: ComponentFixture<KpiCriteriaDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiCriteriaDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KpiCriteriaDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
