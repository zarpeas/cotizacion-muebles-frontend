import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UsuarioService } from './../../../usuarios/services/usuario';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-form-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './form-usuario.html',
  styleUrls: ['./form-usuario.css'],
})
export class FormUsuario implements OnInit {
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  modoEdicion = signal(false);
  idUsuario = signal<number | null>(null);
  mostrarPassword = signal(false);
  guardando = signal(false);
  cargando = signal(false);

  form = this.fb.group({
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    username: ['', Validators.required],
    password: ['', [Validators.minLength(8)]], // Solo requerido al crear
    rol: ['ASESOR', Validators.required],
    estado: [true],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      const id = Number(idParam);
      this.modoEdicion.set(true);
      this.idUsuario.set(id);
      this.cargarUsuario(id);
    } else {
      // Al crear, la contraseña es obligatoria
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
      this.form.get('password')?.updateValueAndValidity();
    }
  }

  private cargarUsuario(id: number): void {
    this.cargando.set(true);

    this.usuarioService.obtener(id).subscribe({
      next: (usuario) => {
        this.form.patchValue({
          nombres: usuario.nombres ?? '',
          apellidos: usuario.apellidos ?? '',
          correo: usuario.correo ?? '',
          username: usuario.username ?? '',
          rol: usuario.rol,
          estado: usuario.estado,
        });
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.toast.error(err?.error?.message || err?.message || 'Error al cargar el usuario');
        this.router.navigate(['/usuarios']);
      },
    });
  }

  guardar(): void {
    if (this.cargando()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const data = this.form.getRawValue() as any;

    // En edición, si no se escribió una nueva contraseña, no se envía.
    if (this.modoEdicion() && !data.password?.trim()) {
      delete data.password;
    }

    const request$ = this.modoEdicion()
      ? this.usuarioService.actualizar(this.idUsuario()!, data)
      : this.usuarioService.crear(data);

    request$.subscribe({
      next: () => {
        this.toast.success(this.modoEdicion() ? 'Usuario actualizado' : 'Usuario registrado');
        this.router.navigate(['/usuarios']);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Error al guardar');
        this.guardando.set(false);
      },
    });
  }
}
