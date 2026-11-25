import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ToastContainer } from '../../../shared/components/toast/toast';
import { LoginRequest } from '../../../core/models/login-request.model';
import { mensajeError } from '../../../shared/utils/error.utils';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, ToastContainer],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  loading = signal<boolean>(false);

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const raw = this.form.getRawValue();
    const credentials: LoginRequest = {
      username: raw.username ?? '',
      password: raw.password ?? '',
    };

    this.auth.login(credentials).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('¡Bienvenido!');
        setTimeout(() => this.router.navigate(['/dashboard']), 500);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.toast.error(mensajeError(err, 'Usuario o contraseña incorrectos'));
      },
    });
  }
}
