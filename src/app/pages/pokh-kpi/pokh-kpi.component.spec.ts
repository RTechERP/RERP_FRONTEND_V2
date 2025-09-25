import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PokhKpiComponent } from './pokh-kpi.component';

describe('PokhKpiComponent', () => {
  let component: PokhKpiComponent;
  let fixture: ComponentFixture<PokhKpiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokhKpiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PokhKpiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
