import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.css',
  standalone: true,
})
export class AuthLayoutComponent {
  constructor(private auth: AuthService) {}

  logout() {
    this.auth.logout();
  }
}
