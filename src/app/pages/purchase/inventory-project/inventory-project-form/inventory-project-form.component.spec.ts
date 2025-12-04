import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventoryProjectFormComponent } from './inventory-project-form.component';

describe('InventoryProjectFormComponent', () => {
  let component: InventoryProjectFormComponent;
  let fixture: ComponentFixture<InventoryProjectFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryProjectFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventoryProjectFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
