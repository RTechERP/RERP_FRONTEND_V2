import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PonccSummaryComponent } from './poncc-summary.component';

describe('PonccSummaryComponent', () => {
  let component: PonccSummaryComponent;
  let fixture: ComponentFixture<PonccSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PonccSummaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PonccSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
