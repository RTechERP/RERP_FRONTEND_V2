import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiRankingComponent } from './kpi-ranking.component';

describe('KpiRankingComponent', () => {
  let component: KpiRankingComponent;
  let fixture: ComponentFixture<KpiRankingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiRankingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KpiRankingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
