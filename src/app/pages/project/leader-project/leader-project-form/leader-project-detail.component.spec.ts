import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaderProjectDetailComponent } from './leader-project-detail.component';

describe('LeaderProjectDetailComponent', () => {
  let component: LeaderProjectDetailComponent;
  let fixture: ComponentFixture<LeaderProjectDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaderProjectDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeaderProjectDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
