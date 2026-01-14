import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-note-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
  ],
  templateUrl: './note-form.component.html',
  styleUrl: './note-form.component.css'
})
export class NoteFormComponent implements OnInit {
  @Input() initialNote: string = '';
  noteForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    public activeModal: NgbActiveModal
  ) {}

  ngOnInit(): void {
    this.noteForm = this.fb.group({
      note: [this.initialNote || '', [Validators.maxLength(1000)]]
    });
  }

  onCancel(): void {
    this.activeModal.dismiss();
  }

  onConfirm(): void {
    if (this.noteForm.valid) {
      const note = this.noteForm.get('note')?.value?.trim() || '';
      this.activeModal.close({ confirmed: true, note: note });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.noteForm.controls).forEach(key => {
        this.noteForm.get(key)?.markAsTouched();
      });
    }
  }
}

