import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BonusCoefficientComponent } from './bonus-coefficient.component';

describe('BonusCoefficientComponent', () => {
  let component: BonusCoefficientComponent;
  let fixture: ComponentFixture<BonusCoefficientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BonusCoefficientComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BonusCoefficientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
