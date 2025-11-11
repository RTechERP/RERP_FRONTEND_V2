import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaderProjectComponent } from './leader-project.component';

describe('LeaderProjectComponent', () => {
  let component: LeaderProjectComponent;
  let fixture: ComponentFixture<LeaderProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaderProjectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeaderProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
