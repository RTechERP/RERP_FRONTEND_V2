import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilmManagementFormComponent } from './film-management-form.component';

describe('FilmManagementFormComponent', () => {
  let component: FilmManagementFormComponent;
  let fixture: ComponentFixture<FilmManagementFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilmManagementFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilmManagementFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
