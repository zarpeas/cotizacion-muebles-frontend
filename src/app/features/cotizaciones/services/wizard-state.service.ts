import { computed, Injectable, inject, signal } from '@angular/core';
import { CotizacionService } from './cotizacion';
import { CatalogoService } from './catalogo.service';
import { ClienteService } from '../../clientes/services/cliente';
import { AuthService } from '../../../core/services/auth.service';
import { iniciales } from '../../../shared/utils/estado.utils';
import { mensajeError } from '../../../shared/utils/error.utils';
import { Cliente } from '../../clientes/models/cliente.model';
import { CatalogoItem, EspesorCatalogoItem } from './catalogo.service';
import {
  MuebleInput,
  MuebleConfirmacionInput,
  PrediccionResponse,
  CotizacionConfirmada,
} from '../models/cotizacion.models';

/**
 * Estado y reglas del asistente de cotización.
 * Se provee a nivel de componente para que cada apertura del wizard empiece limpio.
 */
@Injectable()
export class WizardStateService {
  private readonly cotizacionService = inject(CotizacionService);
  private readonly catalogoService = inject(CatalogoService);
  private readonly clienteService = inject(ClienteService);
  private readonly auth = inject(AuthService);

  readonly paso = signal(1);
  /** Usuario autenticado; el wizard está detrás de authGuard, pero lo validamos al guardar. */
  readonly idUsuario = computed(() => this.auth.user()?.idUsuario ?? null);

  // ============ CATÁLOGOS ============
  readonly categorias = signal<CatalogoItem[]>([]);
  readonly bases = signal<CatalogoItem[]>([]);
  readonly cerraduras = signal<CatalogoItem[]>([]);
  readonly tiposPuerta = signal<CatalogoItem[]>([]);
  readonly espesores = signal<EspesorCatalogoItem[]>([]);

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
    return lista
      .filter((c) => c.razonSocial?.toLowerCase().includes(q) || c.rut?.toLowerCase().includes(q))
      .slice(0, 8);
  });

  // ============ PASO 2: PRODUCTO ============
  readonly form = signal<MuebleInput>(this.formInicial());

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

  readonly iniciales = iniciales;

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

  // ============ HELPERS PARA EL HTML ============
  readonly cantidad = computed(() => this.form().cantidad || 1);
  readonly altoCm = computed(() => this.form().alto);
  readonly anchoCm = computed(() => this.form().ancho);
  readonly fondoCm = computed(() => this.form().fondo);
  readonly colorActualHex = computed(
    () => this.colores.find((x) => x.nombre === this.colorSeleccionado())?.hex || '#ffffff',
  );

  readonly isSinPuerta = computed(() => {
    const id = this.form().idTipoPuerta;
    const tipo = this.tiposPuerta().find((t) => this.getId(t) === id);
    return tipo ? tipo.nombre.toLowerCase().includes('sin puerta') : false;
  });

  readonly cantidadPuertasActual = computed(() => {
    if (this.isSinPuerta()) return 0;
    const val = this.form().cantidadPuertas ?? 1;
    return Math.max(1, val);
  });

  readonly cantidadCasillerosActual = computed(() => {
    if (!this.isSinPuerta()) return 0;
    const val = this.form().cantidadCasilleros ?? 1;
    return Math.max(1, val);
  });

  // ============ VALIDACIÓN DE DIMENSIONES (SOLO FRONTEND) ============
  private readonly PREFIJO_ERROR_DIMENSIONES = 'Dimensiones fuera de rango';

  readonly LIMITES_DIMENSIONES = {
    alto: { min: 100, max: 250, etiqueta: 'Alto' },
    ancho: { min: 40, max: 150, etiqueta: 'Ancho' },
    fondo: { min: 30, max: 100, etiqueta: 'Fondo' },
  };

  readonly rangoInvalido = computed(() => {
    const f = this.form();
    const l = this.LIMITES_DIMENSIONES;
    const fueraDeRango = (valor: unknown, min: number, max: number) => {
      const numero = Number(valor);
      return !Number.isFinite(numero) || numero < min || numero > max;
    };
    return {
      alto: fueraDeRango(f.alto, l.alto.min, l.alto.max),
      ancho: fueraDeRango(f.ancho, l.ancho.min, l.ancho.max),
      fondo: fueraDeRango(f.fondo, l.fondo.min, l.fondo.max),
    };
  });

  readonly dimensionesValidas = computed(() => {
    const r = this.rangoInvalido();
    return !r.alto && !r.ancho && !r.fondo;
  });

  readonly mensajeDimensiones = computed(() => {
    const l = this.LIMITES_DIMENSIONES;
    const r = this.rangoInvalido();
    const detalles = (Object.keys(r) as Array<keyof typeof l>)
      .filter((campo) => r[campo])
      .map((campo) => `${l[campo].etiqueta}: ${l[campo].min}–${l[campo].max} cm`);
    return detalles.length ? `${this.PREFIJO_ERROR_DIMENSIONES} (${detalles.join(', ')})` : '';
  });

  // ============ RESÚMENES DE CATÁLOGO ============
  readonly tipoCerradura = computed(() => {
    const id = this.form().idCerradura;
    return this.cerraduras().find((c) => this.getId(c) === id)?.nombre || '—';
  });

  readonly categoriaSeleccionada = computed(() => {
    const id = this.form().idCategoriaProducto;
    return this.categorias().find((c) => this.getId(c) === id)?.nombre || '—';
  });

  readonly espesorSeleccionado = computed(() => {
    const id = this.form().idEspesor;
    const esp = this.espesores().find((e) => this.getId(e) === id);
    return esp ? `${esp.milimetros} mm` : '—';
  });

  readonly zocaloOPatas = computed(() => {
    const id = this.form().idBase;
    return this.bases().find((b) => this.getId(b) === id)?.nombre || '—';
  });

  readonly tipoPuerta = computed(() => {
    const id = this.form().idTipoPuerta;
    return this.tiposPuerta().find((t) => this.getId(t) === id)?.nombre || '—';
  });

  private readonly ERROR_CLIENTE_CONTINUAR = 'Por favor, selecciona un cliente para continuar.';
  private readonly ERROR_CLIENTE_GUARDAR = 'Debe seleccionar un cliente.';

  // ============ CARGA INICIAL ============
  inicializar(): void {
    this.cargarClientes();
    this.cargarCatalogos();
  }

  cargarClientes(): void {
    this.clienteService.listar().subscribe((data) => this.clientes.set(data));
  }

  cargarCatalogos(): void {
    this.catalogoService.getCategorias().subscribe((data) => {
      this.categorias.set(data);
      if (data.length > 0 && this.form().idCategoriaProducto === 0) {
        this.form.update((f) => ({ ...f, idCategoriaProducto: this.getId(data[0]) }));
      }
    });

    this.catalogoService.getBases().subscribe((data) => {
      this.bases.set(data);
      if (data.length > 0 && this.form().idBase === 0) {
        this.form.update((f) => ({ ...f, idBase: this.getId(data[0]) }));
      }
    });

    this.catalogoService.getCerraduras().subscribe((data) => {
      this.cerraduras.set(data);
      if (data.length > 0 && this.form().idCerradura === 0) {
        this.form.update((f) => ({ ...f, idCerradura: this.getId(data[0]) }));
      }
    });

    this.catalogoService.getTiposPuerta().subscribe((data) => {
      this.tiposPuerta.set(data);
      if (data.length > 0 && this.form().idTipoPuerta === 0) {
        this.form.update((f) => ({ ...f, idTipoPuerta: this.getId(data[0]) }));
      }
    });

    this.catalogoService.getEspesores().subscribe((data) => {
      this.espesores.set(data);
      if (data.length > 0 && this.form().idEspesor === 0) {
        this.form.update((f) => ({ ...f, idEspesor: this.getId(data[0]) }));
      }
    });
  }

  // ============ HELPERS PARA CATÁLOGOS ============
  getId(obj: unknown): number {
    if (typeof obj === 'number') return obj;
    if (!obj || typeof obj !== 'object') return 0;

    const entrada = obj as Record<string, unknown>;
    const idKey = Object.keys(entrada).find(
      (k) => k.toLowerCase().startsWith('id') && typeof entrada[k] === 'number',
    );
    return idKey ? (entrada[idKey] as number) : 0;
  }

  setId(campo: keyof MuebleInput, valor: number): void {
    this.form.update((f) => ({ ...f, [campo]: valor }));
    this.prediccion.set(null);
  }

  // ============ NAVEGACIÓN ============
  siguiente(): void {
    if (this.paso() === 1 && !this.clienteSeleccionado()) {
      this.error.set(this.ERROR_CLIENTE_CONTINUAR);
      return;
    }
    if (this.paso() === 2) {
      if (!this.validarDimensiones()) return;
      if (!this.prediccion()) {
        this.predecir();
      }
    }
    this.paso.update((p) => Math.min(p + 1, 4));
  }

  anterior(): void {
    this.paso.update((p) => Math.max(p - 1, 1));
  }

  irA(n: number): void {
    if (n < this.paso()) this.paso.set(n);
  }

  // ============ PASO 1 LÓGICA ============
  buscarCliente(event: Event): void {
    this.busquedaCliente.set((event.target as HTMLInputElement).value);
    this.mostrarListaClientes.set(true);
  }

  seleccionarCliente(c: Cliente): void {
    this.clienteSeleccionado.set(c);
    this.busquedaCliente.set(c.razonSocial);
    this.mostrarListaClientes.set(false);
    if (
      this.error() === this.ERROR_CLIENTE_CONTINUAR ||
      this.error() === this.ERROR_CLIENTE_GUARDAR
    ) {
      this.error.set(null);
    }
  }

  limpiarCliente(): void {
    this.clienteSeleccionado.set(null);
    this.busquedaCliente.set('');
  }

  // ============ PASO 2 LÓGICA ============
  setNum(campo: keyof MuebleInput, eventOrValue: unknown): void {
    let valor: number;
    if (eventOrValue instanceof Event) {
      valor = Number((eventOrValue.target as HTMLInputElement).value);
    } else {
      valor = Number(eventOrValue);
    }
    this.form.update((f) => ({ ...f, [campo]: valor }));
    this.prediccion.set(null);
    if (
      (campo === 'alto' || campo === 'ancho' || campo === 'fondo') &&
      this.error()?.startsWith(this.PREFIJO_ERROR_DIMENSIONES)
    ) {
      this.error.set(null);
    }
  }

  setText(campo: keyof MuebleInput, event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.form.update((f) => ({ ...f, [campo]: valor }));
    this.prediccion.set(null);
  }

  incrementar(
    campo: 'cantidad' | 'cantidadPuertas' | 'cantidadBandejas' | 'cantidadCasilleros',
  ): void {
    if (campo === 'cantidadPuertas' && this.isSinPuerta()) return;
    if (campo === 'cantidadCasilleros' && !this.isSinPuerta()) return;

    const minVal =
      campo === 'cantidad'
        ? 1
        : campo === 'cantidadPuertas' || campo === 'cantidadCasilleros'
          ? 1
          : 0;
    this.form.update((f) => ({ ...f, [campo]: ((f[campo] as number) || minVal) + 1 }));
    this.prediccion.set(null);
  }

  decrementar(
    campo: 'cantidad' | 'cantidadPuertas' | 'cantidadBandejas' | 'cantidadCasilleros',
  ): void {
    if (campo === 'cantidadPuertas' && this.isSinPuerta()) return;
    if (campo === 'cantidadCasilleros' && !this.isSinPuerta()) return;

    const minVal =
      campo === 'cantidad'
        ? 1
        : campo === 'cantidadPuertas' || campo === 'cantidadCasilleros'
          ? 1
          : 0;
    this.form.update((f) => ({
      ...f,
      [campo]: Math.max(minVal, ((f[campo] as number) || 0) - 1),
    }));
    this.prediccion.set(null);
  }

  setTechoInclinado(tipo: string): void {
    this.techoInclinadoSel.set(tipo);
    this.form.update((f) => ({ ...f, techoInclinado: tipo === 'Con techo inclinado' }));
    this.prediccion.set(null);
  }

  setColor(nombre: string): void {
    this.colorSeleccionado.set(nombre);
    this.form.update((f) => ({ ...f, idColor: 1 }));
  }

  setTipoPuerta(id: number): void {
    this.form.update((f) => {
      const tipo = this.tiposPuerta().find((t) => this.getId(t) === id);
      const esSinPuerta = tipo ? tipo.nombre.toLowerCase().includes('sin puerta') : false;

      return {
        ...f,
        idTipoPuerta: id,
        cantidadPuertas: esSinPuerta ? 0 : f.cantidadPuertas === 0 ? 1 : f.cantidadPuertas,
        cantidadCasilleros: esSinPuerta
          ? f.cantidadCasilleros === 0
            ? 1
            : f.cantidadCasilleros
          : 0,
      };
    });
    this.prediccion.set(null);
  }

  /** Bloquea el avance si alguna medida está fuera de los rangos permitidos. */
  validarDimensiones(): boolean {
    if (this.dimensionesValidas()) return true;
    this.error.set(this.mensajeDimensiones());
    return false;
  }

  // ============ ML Y GUARDADO ============
  predecir(): void {
    if (!this.validarDimensiones()) return;

    const f = this.form();

    const payload: MuebleInput = {
      ...f,
      idCategoriaProducto: f.idCategoriaProducto || this.getId(this.categorias()[0]),
      idBase: f.idBase || this.getId(this.bases()[0]),
      idCerradura: f.idCerradura || this.getId(this.cerraduras()[0]),
      idTipoPuerta: f.idTipoPuerta || this.getId(this.tiposPuerta()[0]),
      idEspesor: f.idEspesor || this.getId(this.espesores()[0]),
    };

    if (
      !payload.idCategoriaProducto ||
      !payload.idBase ||
      !payload.idCerradura ||
      !payload.idTipoPuerta ||
      !payload.idEspesor
    ) {
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
      error: (err: unknown) => {
        this.error.set('Error al predecir: ' + mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  confirmar(): void {
    if (!this.validarDimensiones()) return;
    if (!this.clienteSeleccionado()) {
      this.error.set(this.ERROR_CLIENTE_GUARDAR);
      return;
    }
    if (!this.prediccion()) {
      this.error.set('Debe calcular la cotización antes de guardar.');
      return;
    }

    const idUsuario = this.idUsuario();
    if (idUsuario === null) {
      this.error.set('No hay una sesión activa. Inicia sesión nuevamente.');
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    const esSinPuerta = this.isSinPuerta();

    const payload: MuebleConfirmacionInput = {
      ...this.form(),
      cantidad: this.cantidad(),
      techoInclinado: this.form().techoInclinado ? 1 : 0,
      cantidadPuertas: esSinPuerta ? 0 : this.form().cantidadPuertas || 1,
      cantidadCasilleros: esSinPuerta ? this.form().cantidadCasilleros || 1 : 0,
      costoFabricacionUnitario: Math.round(this.costoUnitario()),
      precioVentaSugerido: Math.round(this.precioUnitario()),
    };

    const idCliente = this.clienteSeleccionado()!.idCliente;

    this.cotizacionService.confirmar(payload, idCliente, idUsuario).subscribe({
      next: (res) => {
        this.confirmada.set(res);
        const prediccionActual = this.prediccion();
        if (prediccionActual) {
          this.prediccion.set({
            ...prediccionActual,
            costoFabricacionUnitario: res.costoFabricacionUnitario,
            precioVentaSugerido: res.precioVentaSugerido,
          });
        }
        this.cargando.set(false);
        this.paso.set(4);
      },
      error: (err: unknown) => {
        this.error.set('Error al guardar: ' + mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  /** Reinicia el asistente para una nueva cotización. */
  reiniciar(): void {
    this.form.set(this.formInicial(true));
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

  private formInicial(paraNueva = false): MuebleInput {
    return {
      idCategoriaProducto: 0,
      codigoFamilia: '',
      idBase: 0,
      idCerradura: 0,
      idTipoPuerta: 0,
      idEspesor: 0,
      alto: 180,
      ancho: 90,
      fondo: 50,
      cantidad: 1,
      cantidadPuertas: 1,
      cantidadCasilleros: paraNueva ? 1 : 2,
      cantidadBandejas: 0,
      techoInclinado: false,
      divisiones: 1,
    };
  }
}
