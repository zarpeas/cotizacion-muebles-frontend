import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css'
})
export class Topbar {
  private auth = inject(AuthService);
  user = this.auth.user;

  initials(): string {
    const u = this.user();
    if (!u) return '?';
    return (u.nombres?.[0] ?? '') + (u.apellidos?.[0] ?? '');
  }
}