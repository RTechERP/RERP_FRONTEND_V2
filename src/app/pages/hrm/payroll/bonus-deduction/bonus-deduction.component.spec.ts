import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BonusDeductionComponent } from './bonus-deduction.component';

describe('BonusDeductionComponent', () => {
  let component: BonusDeductionComponent;
  let fixture: ComponentFixture<BonusDeductionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BonusDeductionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BonusDeductionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
