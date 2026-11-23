import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UsuarioService } from '../../../usuarios/services/usuario';
import { Usuario } from '../../models/usuario.model';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './lista-usuarios.html',
  styleUrls: ['./lista-usuarios.css'],
})
export class ListaUsuarios implements OnInit {
  private usuarioService = inject(UsuarioService);
  private confirm = inject(ConfirmService);
  private toast = inject(ToastService);

  usuarios = signal<Usuario[]>([]);
  cargando = signal(true);
  filtro = signal('');
  filtroRol = signal('');
  filtroEstado = signal('');

  // KPIs
  totalUsuarios = computed(() => this.usuarios().length);
  totalActivos = computed(() => this.usuarios().filter((u) => u.estado).length);
  totalDeshabilitados = computed(() => this.usuarios().filter((u) => !u.estado).length);

  // Filtrado local
  usuariosFiltrados = computed(() => {
    let lista = this.usuarios();
    const q = this.filtro().toLowerCase();
    const rol = this.filtroRol();
    const est = this.filtroEstado();

    if (q) {
      lista = lista.filter(
        (u) =>
          u.nombres?.toLowerCase().includes(q) ||
          u.apellidos?.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q) ||
          u.correo?.toLowerCase().includes(q),
      );
    }
    if (rol) lista = lista.filter((u) => u.rol === rol);
    if (est) lista = lista.filter((u) => u.estado === (est === 'activo'));

    return lista;
  });

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando.set(true);
    this.usuarioService.listar().subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  async toggleEstado(usuario: Usuario): Promise<void> {
    if (!usuario.idUsuario) return;

    const deshabilitar = usuario.estado;
    const nombre = `${usuario.nombres} ${usuario.apellidos}`;

    const ok = await this.confirm.confirm({
      title: deshabilitar ? 'Deshabilitar usuario' : 'Habilitar usuario',
      message: deshabilitar
        ? `¿Estás seguro de deshabilitar a "${nombre}"? El usuario no podrá acceder al sistema.`
        : `¿Estás seguro de habilitar a "${nombre}"? El usuario podrá volver a acceder al sistema.`,
      confirmText: deshabilitar ? 'Deshabilitar' : 'Habilitar',
      danger: deshabilitar,
    });

    if (!ok) return;

    this.usuarioService.cambiarEstado(usuario.idUsuario, !usuario.estado).subscribe({
      next: () => {
        this.toast.success(
          deshabilitar ? 'Usuario deshabilitado correctamente' : 'Usuario habilitado correctamente',
        );
        this.cargarUsuarios();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Error al cambiar el estado del usuario');
      },
    });
  }

  iniciales(nombres: string, apellidos: string): string {
    return (nombres.charAt(0) + apellidos.charAt(0)).toUpperCase();
  }
}
