import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterIdeaComponent } from './register-idea.component';

describe('RegisterIdeaComponent', () => {
  let component: RegisterIdeaComponent;
  let fixture: ComponentFixture<RegisterIdeaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterIdeaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterIdeaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
