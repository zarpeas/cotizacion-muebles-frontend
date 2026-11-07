import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClienteService } from '../../services/cliente';
import { ToastService } from '../../../../shared/services/toast.service';
import { Cliente } from '../../models/cliente.model';

@Component({
  selector: 'app-form-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './form-cliente.html',
  styleUrls: ['./form-cliente.css'],
})
export class FormCliente implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly clienteService = inject(ClienteService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly modoEdicion = signal(false);
  readonly idCliente = signal<number | null>(null);
  readonly guardando = signal(false);
  readonly cargando = signal(false);
  readonly errorMsg = signal<string | null>(null);

  readonly form = this.fb.group({
    razonSocial: ['', [Validators.required, Validators.maxLength(200)]],
    rut:         ['', [Validators.required, Validators.maxLength(30)]],
    correo:      ['', [Validators.required, Validators.email]],
    telefono:    ['', [Validators.required, Validators.maxLength(30)]],
    direccion:   ['', [Validators.required, Validators.maxLength(250)]],
    ciudad:      ['', [Validators.required, Validators.maxLength(100)]],
    comuna:      ['', [Validators.required, Validators.maxLength(100)]],
    estado: [true],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.modoEdicion.set(true);
      this.idCliente.set(Number(id));
      this.cargarCliente(Number(id));
    }
  }

  private cargarCliente(id: number): void {
    this.cargando.set(true);
    this.clienteService.obtener(id).subscribe({
      next: (c: Cliente) => {
        this.form.patchValue({
          razonSocial: c.razonSocial,
          rut: c.rut,
          correo: c.correo ?? '',
          telefono: c.telefono ?? '',
          direccion: c.direccion ?? '',
          ciudad: c.ciudad ?? '',
          comuna: c.comuna ?? '',
          estado: c.estado,   
        });
        this.cargando.set(false);
      },
      error: (err) => {
        this.errorMsg.set('Error al cargar cliente: ' + (err?.error?.message ?? err.message));
        this.cargando.set(false);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.errorMsg.set(null);

     const payload = this.form.getRawValue();

    const request$ = this.modoEdicion()
    ? this.clienteService.actualizar(this.idCliente()!, payload as any)
    : this.clienteService.crear({ ...payload, estado: true } as any);

    request$.subscribe({
      next: () => {
        this.toast.success(
          this.modoEdicion() ? 'Cliente actualizado' : 'Cliente registrado'
        );
        this.router.navigate(['/clientes']);
      },
      error: (err) => {
        this.errorMsg.set('Error al guardar: ' + (err?.error?.message ?? err.message));
        this.guardando.set(false);
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['/clientes']);
  }

    isInvalid(campo: string): boolean {
    const control = this.form.get(campo);
    return !!(control && control.invalid && control.touched);
  }
  errorDe(campo: string): string {
    const control = this.form.get(campo);
    if (!control || !control.errors) return '';

    if (control.errors['required']) {
      return 'Este campo es obligatorio.';
    }
    if (control.errors['email']) {
      return 'Ingresa un correo electrónico válido.';
    }
    if (control.errors['maxlength']) {
      const max = control.errors['maxlength'].requiredLength;
      return `Máximo ${max} caracteres.`;
    }
    return 'Valor inválido.';
  }
}