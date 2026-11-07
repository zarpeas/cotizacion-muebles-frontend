import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CotizacionService } from '../../services/cotizacion';
import { CatalogoService } from '../../services/catalogo.service';
import { ClienteService } from '../../../clientes/services/cliente';
import { Cliente } from '../../../clientes/models/cliente.model';
import { MuebleInput, PrediccionResponse, CotizacionConfirmada } from '../../models/cotizacion.models';

@Component({
  selector: 'app-wizard-cotizacion',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  styleUrl: './wizard-cotizacion.css',
  templateUrl: './wizard-cotizacion.html',
})
export class WizardCotizacion implements OnInit {
  private readonly cotizacionService = inject(CotizacionService);
  private readonly catalogoService = inject(CatalogoService);
  private readonly clienteService = inject(ClienteService);
  private readonly router = inject(Router);

  readonly pasos = [
    { n: 1, label: 'Cliente',  sub: 'Selecciona el cliente' },
    { n: 2, label: 'Producto', sub: 'Configura componentes' },
    { n: 3, label: 'Reglas',   sub: 'Markup según cantidad' },
    { n: 4, label: 'Resumen',  sub: 'Revisa y confirma' },
  ];

  readonly paso = signal(1);
  readonly idUsuario = 1;

  // ============ CATÁLOGOS ============
  readonly categorias = signal<any[]>([]);
  readonly bases = signal<any[]>([]);
  readonly cerraduras = signal<any[]>([]);
  readonly tiposPuerta = signal<any[]>([]);
  readonly espesores = signal<any[]>([]);

  // ============ PASO 1: CLIENTE ============
  readonly clientes = signal<Cliente[]>([]);
  readonly clienteSeleccionado = signal<Cliente | null>(null);
  readonly busquedaCliente = signal('');
  readonly cargandoClientes = signal(false);
  readonly mostrarListaClientes = signal(false);

  readonly clientesFiltrados = computed(() => {
    const q = this.busquedaCliente().toLowerCase().trim();
    const lista = this.clientes();
    if (!q) return lista.slice(0, 8);
    return lista.filter(c =>
      c.razonSocial?.toLowerCase().includes(q) ||
      c.rut?.toLowerCase().includes(q)
    ).slice(0, 8);
  });

  // ============ PASO 2: PRODUCTO ============
  readonly form = signal<MuebleInput>({
    idCategoriaProducto: 0,
    codigoFamilia: '', // <-- NUEVO CAMPO AGREGADO
    idBase: 0,
    idCerradura: 0,
    idTipoPuerta: 0,
    idEspesor: 0,
    alto: 180,
    ancho: 90,
    fondo: 50,
    cantidad: 1,
    cantidadPuertas: 1,
    cantidadBandejas: 0,
    techoInclinado: false,
    kgTotal: 50,
    divisiones: 1
  });

  readonly colorSeleccionado = signal('Gris Eco');
  readonly techoInclinadoSel = signal<string>('Sin techo inclinado');

  readonly colores = [
    { nombre: 'Gris Eco', hex: '#dfe2e1' },
    { nombre: 'Gris Ágata', hex: '#9a9ea3' },
    { nombre: 'Rojo', hex: '#bd2230' },
    { nombre: 'Azul', hex: '#213a6b' },
    { nombre: 'Verde', hex: '#3aa655' },
    { nombre: 'Amarillo', hex: '#fbe83a' },
    { nombre: 'Negro', hex: '#0b0b0d' },
    { nombre: 'Blanco antimicrobiano', hex: '#eaf1f3' },
    { nombre: 'Blanco', hex: '#ffffff' },
  ];

  // ============ CICLO DE VIDA ============
  ngOnInit(): void {
    this.cargarClientes();
    this.cargarCatalogos();
  }

  cargarClientes(): void {
    this.clienteService.listar().subscribe(data => this.clientes.set(data));
  }

  cargarCatalogos(): void {
    this.catalogoService.getCategorias().subscribe((data: any[]) => {
      this.categorias.set(data);
      if (data.length > 0 && this.form().idCategoriaProducto === 0) {
        this.form.update(f => ({ ...f, idCategoriaProducto: this.getId(data[0]) }));
      }
    });

    this.catalogoService.getBases().subscribe((data: any[]) => {
      this.bases.set(data);
      if (data.length > 0 && this.form().idBase === 0) {
        this.form.update(f => ({ ...f, idBase: this.getId(data[0]) }));
      }
    });

    this.catalogoService.getCerraduras().subscribe((data: any[]) => {
      this.cerraduras.set(data);
      if (data.length > 0 && this.form().idCerradura === 0) {
        this.form.update(f => ({ ...f, idCerradura: this.getId(data[0]) }));
      }
    });

    this.catalogoService.getTiposPuerta().subscribe((data: any[]) => {
      this.tiposPuerta.set(data);
      if (data.length > 0 && this.form().idTipoPuerta === 0) {
        this.form.update(f => ({ ...f, idTipoPuerta: this.getId(data[0]) }));
      }
    });

    this.catalogoService.getEspesores().subscribe((data: any[]) => {
      this.espesores.set(data);
      if (data.length > 0 && this.form().idEspesor === 0) {
        this.form.update(f => ({ ...f, idEspesor: this.getId(data[0]) }));
      }
    });
  }

  // ============ HELPERS PARA CATÁLOGOS ============
  getId(obj: any): number {
    if (!obj) return 0;
    if (typeof obj === 'number') return obj;
    const keys = Object.keys(obj);
    const idKey = keys.find(k => k.toLowerCase().startsWith('id') && typeof obj[k] === 'number');
    return idKey ? obj[idKey] : 0;
  }

  setId(campo: keyof MuebleInput, valor: number) {
    this.form.update(f => ({ ...f, [campo]: valor }));
    this.prediccion.set(null);
  }

  // ============ NAVEGACIÓN ============
  siguiente(): void {
    if (this.paso() === 1 && !this.clienteSeleccionado()) {
      this.error.set('Por favor, selecciona un cliente para continuar.');
      return;
    }
    if (this.paso() === 2 && !this.prediccion()) {
      this.predecir();
    }
    this.paso.update(p => Math.min(p + 1, 4));
  }

  anterior(): void { this.paso.update(p => Math.max(p - 1, 1)); }
  irA(n: number): void { if (n < this.paso()) this.paso.set(n); }

  // ============ PASO 1 LÓGICA ============
  buscarCliente(event: Event) {
    this.busquedaCliente.set((event.target as HTMLInputElement).value);
    this.mostrarListaClientes.set(true);
  }
  seleccionarCliente(c: Cliente) {
    this.clienteSeleccionado.set(c);
    this.busquedaCliente.set(c.razonSocial);
    this.mostrarListaClientes.set(false);
  }
  iniciales(nombre: string | null | undefined): string {
    if (!nombre) return '?';
    return nombre.trim().split(/\s+/).slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('');
  }
  limpiarCliente() { this.clienteSeleccionado.set(null); this.busquedaCliente.set(''); }

  // ============ PASO 2 LÓGICA ============
  setNum(campo: keyof MuebleInput, event: Event) {
    const valor = Number((event.target as HTMLInputElement).value);
    this.form.update(f => ({ ...f, [campo]: valor }));
    this.prediccion.set(null);
  }

  // NUEVO MÉTODO PARA CAPTURAR EL TEXTO DEL CÓDIGO
  setText(campo: keyof MuebleInput, event: Event) {
    const valor = (event.target as HTMLInputElement).value;
    this.form.update(f => ({ ...f, [campo]: valor }));
    this.prediccion.set(null);
  }

  incrementar(campo: 'cantidad' | 'cantidadPuertas' | 'cantidadBandejas') {
    this.form.update(f => ({ ...f, [campo]: (f[campo] as number || 0) + 1 }));
    this.prediccion.set(null);
  }

  decrementar(campo: 'cantidad' | 'cantidadPuertas' | 'cantidadBandejas') {
    this.form.update(f => ({ ...f, [campo]: Math.max(0, (f[campo] as number || 0) - 1) }));
    this.prediccion.set(null);
  }

  setTechoInclinado(tipo: string) {
    this.techoInclinadoSel.set(tipo);
    this.form.update(f => ({ ...f, techoInclinado: tipo === 'Con techo inclinado' }));
    this.prediccion.set(null);
  }

  setColor(nombre: string) {
    this.colorSeleccionado.set(nombre);
    this.form.update(f => ({ ...f, idColor: 1 })); 
  }

  // ============ HELPERS PARA EL HTML ============
  readonly cantidad = computed(() => this.form().cantidad || 1);
  readonly altoCm = computed(() => this.form().alto);
  readonly anchoCm = computed(() => this.form().ancho);
  readonly fondoCm = computed(() => this.form().fondo);
  readonly colorActualHex = computed(() => this.colores.find(x => x.nombre === this.colorSeleccionado())?.hex || '#ffffff');
  
  readonly tipoCerradura = computed(() => {
    const id = this.form().idCerradura;
    return this.cerraduras().find((c: any) => this.getId(c) === id)?.nombre || '—';
  });

  readonly categoriaSeleccionada = computed(() => {
    const id = this.form().idCategoriaProducto;
    return this.categorias().find((c: any) => this.getId(c) === id)?.nombre || '—';
  });

  readonly espesorSeleccionado = computed(() => {
    const id = this.form().idEspesor;
    const esp = this.espesores().find((e: any) => this.getId(e) === id);
    return esp ? `${esp.milimetros} mm` : '—';
  });

  readonly zocaloOPatas = computed(() => {
    const id = this.form().idBase;
    return this.bases().find((b: any) => this.getId(b) === id)?.nombre || '—';
  });

  readonly tipoPuerta = computed(() => {
    const id = this.form().idTipoPuerta;
    return this.tiposPuerta().find((t: any) => this.getId(t) === id)?.nombre || '—';
  });

  // ============ ML Y CÁLCULOS ============
  readonly prediccion = signal<PrediccionResponse | null>(null);
  readonly confirmada = signal<CotizacionConfirmada | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly costoUnitario = computed(() => this.prediccion()?.costoFabricacionUnitario ?? 0);
  
  readonly markupActual = computed(() => {
    const q = this.cantidad();
    if (q <= 5) return 3.5;
    if (q <= 10) return 3.0;
    return 2.5;
  });

  readonly etiquetaMarkup = computed(() => {
    const q = this.cantidad();
    if (q <= 5) return '(de 1 a 5 unidades)';
    if (q <= 10) return '(de 6 a 10 unidades)';
    return '(más de 10 unidades)';
  });

  readonly precioUnitario = computed(() => this.costoUnitario() * this.markupActual());
  readonly precioSugeridoTotal = computed(() => this.precioUnitario() * this.cantidad());
  readonly aplicaDescuento = computed(() => this.cantidad() > 10);

  predecir(): void {
    const f = this.form();
    
    const payload: MuebleInput = {
      ...f,
      idCategoriaProducto: f.idCategoriaProducto || this.getId(this.categorias()[0]),
      idBase: f.idBase || this.getId(this.bases()[0]),
      idCerradura: f.idCerradura || this.getId(this.cerraduras()[0]),
      idTipoPuerta: f.idTipoPuerta || this.getId(this.tiposPuerta()[0]),
      idEspesor: f.idEspesor || this.getId(this.espesores()[0]),
    };

    if (!payload.idCategoriaProducto || !payload.idBase || !payload.idCerradura || !payload.idTipoPuerta || !payload.idEspesor) {
      this.error.set('Error: Faltan datos en los catálogos. Revisa la consola.');
      return; 
    }

    this.cargando.set(true);
    this.error.set(null);

    this.cotizacionService.predecir(payload).subscribe({
      next: (res) => {
        this.prediccion.set(res);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set('Error al predecir: ' + (err?.error?.message ?? err.message));
        this.cargando.set(false);
      },
    });
  }

  confirmar(): void {
    if (!this.clienteSeleccionado()) {
      this.error.set('Debe seleccionar un cliente.');
      return;
    }
    this.cargando.set(true);
    this.error.set(null);

    const payload: any = {
      ...this.form(),
      cantidad: this.cantidad(),
      techoInclinado: this.form().techoInclinado ? 1 : 0
    };

    const idCliente = this.clienteSeleccionado()!.idCliente;

    this.cotizacionService.confirmar(payload, idCliente).subscribe({
      next: (res: any) => {
        this.confirmada.set(res);
        this.prediccion.set(res.prediccion || this.prediccion());
        this.cargando.set(false);
        this.paso.set(4);
      },
      error: (err) => {
        this.error.set('Error al guardar: ' + (err?.error?.message ?? err.message));
        this.cargando.set(false);
      },
    });
  }

  irAlListado(): void { this.router.navigate(['/cotizaciones']); }

  nueva(): void {
    this.form.set({
      idCategoriaProducto: 0, 
      codigoFamilia: '', // <-- RESETEADO AQUÍ TAMBIÉN
      idBase: 0, idCerradura: 0, idTipoPuerta: 0, idEspesor: 0,
      alto: 180, ancho: 90, fondo: 50, cantidad: 1, cantidadPuertas: 1, cantidadBandejas: 0,
      techoInclinado: false, kgTotal: 50, divisiones: 1
    });
    this.colorSeleccionado.set('Gris Eco');
    this.techoInclinadoSel.set('Sin techo inclinado');
    this.clienteSeleccionado.set(null);
    this.busquedaCliente.set('');
    this.prediccion.set(null);
    this.confirmada.set(null);
    this.error.set(null);
    this.paso.set(1);
    this.cargarCatalogos();
  }
}