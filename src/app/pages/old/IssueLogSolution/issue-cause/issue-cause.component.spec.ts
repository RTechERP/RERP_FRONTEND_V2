import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueCauseComponent } from './issue-cause.component';

describe('IssueCauseComponent', () => {
  let component: IssueCauseComponent;
  let fixture: ComponentFixture<IssueCauseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueCauseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IssueCauseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
