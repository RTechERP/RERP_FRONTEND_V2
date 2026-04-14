import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FiveSRatingDetailComponent } from './five-s-rating-detail.component';

describe('FiveSRatingDetailComponent', () => {
  let component: FiveSRatingDetailComponent;
  let fixture: ComponentFixture<FiveSRatingDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FiveSRatingDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FiveSRatingDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
