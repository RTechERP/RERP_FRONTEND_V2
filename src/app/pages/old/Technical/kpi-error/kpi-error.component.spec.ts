import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiErrorComponent } from './kpi-error.component';

describe('KpiErrorComponent', () => {
  let component: KpiErrorComponent;
  let fixture: ComponentFixture<KpiErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiErrorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KpiErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
