import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BonusDeductionDetailComponent } from './bonus-deduction-detail.component';

describe('BonusDeductionDetailComponent', () => {
  let component: BonusDeductionDetailComponent;
  let fixture: ComponentFixture<BonusDeductionDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BonusDeductionDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BonusDeductionDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
