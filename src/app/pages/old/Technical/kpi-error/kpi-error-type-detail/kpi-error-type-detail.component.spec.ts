import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiErrorTypeDetailComponent } from './kpi-error-type-detail.component';

describe('KpiErrorTypeDetailComponent', () => {
  let component: KpiErrorTypeDetailComponent;
  let fixture: ComponentFixture<KpiErrorTypeDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiErrorTypeDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KpiErrorTypeDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
