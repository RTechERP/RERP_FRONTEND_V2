import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CopyQuestionComponent } from './copy-question.component';

describe('CopyQuestionComponent', () => {
  let component: CopyQuestionComponent;
  let fixture: ComponentFixture<CopyQuestionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CopyQuestionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CopyQuestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
