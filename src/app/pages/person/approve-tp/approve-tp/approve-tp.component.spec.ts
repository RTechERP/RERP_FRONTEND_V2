import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApproveTpComponent } from './approve-tp.component';

describe('ApproveTpComponent', () => {
  let component: ApproveTpComponent;
  let fixture: ComponentFixture<ApproveTpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApproveTpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApproveTpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
