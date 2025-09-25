import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FollowProductReturnComponent } from './follow-product-return.component';

describe('FollowProductReturnComponent', () => {
  let component: FollowProductReturnComponent;
  let fixture: ComponentFixture<FollowProductReturnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FollowProductReturnComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FollowProductReturnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
