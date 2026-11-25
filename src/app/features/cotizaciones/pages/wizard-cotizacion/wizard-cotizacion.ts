import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WizardStateService } from '../../services/wizard-state.service';
import { Cliente } from '../../../clientes/models/cliente.model';
import { MuebleInput } from '../../models/cotizacion.models';

type CampoCantidad = 'cantidad' | 'cantidadPuertas' | 'cantidadBandejas' | 'cantidadCasilleros';

@Component({
  selector: 'app-wizard-cotizacion',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  providers: [WizardStateService],
  styleUrl: './wizard-cotizacion.css',
  templateUrl: './wizard-cotizacion.html',
})
export class WizardCotizacion implements OnInit {
  private readonly router = inject(Router);
  private readonly state = inject(WizardStateService);

  readonly pasos = [
    { n: 1, label: 'Cliente', sub: 'Selecciona el cliente' },
    { n: 2, label: 'Producto', sub: 'Configura componentes' },
    { n: 3, label: 'Reglas', sub: 'Markup según cantidad' },
    { n: 4, label: 'Resumen', sub: 'Revisa y confirma' },
  ];

  // El componente solo expone el estado; las reglas viven en WizardStateService.
  readonly paso = this.state.paso;
  readonly error = this.state.error;
  readonly cargando = this.state.cargando;
  readonly clientes = this.state.clientes;
  readonly clienteSeleccionado = this.state.clienteSeleccionado;
  readonly busquedaCliente = this.state.busquedaCliente;
  readonly cargandoClientes = this.state.cargandoClientes;
  readonly mostrarListaClientes = this.state.mostrarListaClientes;
  readonly clientesFiltrados = this.state.clientesFiltrados;

  readonly categorias = this.state.categorias;
  readonly bases = this.state.bases;
  readonly cerraduras = this.state.cerraduras;
  readonly tiposPuerta = this.state.tiposPuerta;
  readonly espesores = this.state.espesores;
  readonly form = this.state.form;
  readonly colorSeleccionado = this.state.colorSeleccionado;
  readonly techoInclinadoSel = this.state.techoInclinadoSel;
  readonly colores = this.state.colores;

  readonly isSinPuerta = this.state.isSinPuerta;
  readonly cantidadPuertasActual = this.state.cantidadPuertasActual;
  readonly cantidadCasillerosActual = this.state.cantidadCasillerosActual;
  readonly cantidad = this.state.cantidad;
  readonly altoCm = this.state.altoCm;
  readonly anchoCm = this.state.anchoCm;
  readonly fondoCm = this.state.fondoCm;
  readonly colorActualHex = this.state.colorActualHex;

  readonly LIMITES_DIMENSIONES = this.state.LIMITES_DIMENSIONES;
  readonly rangoInvalido = this.state.rangoInvalido;
  readonly dimensionesValidas = this.state.dimensionesValidas;
  readonly mensajeDimensiones = this.state.mensajeDimensiones;

  readonly tipoCerradura = this.state.tipoCerradura;
  readonly categoriaSeleccionada = this.state.categoriaSeleccionada;
  readonly espesorSeleccionado = this.state.espesorSeleccionado;
  readonly zocaloOPatas = this.state.zocaloOPatas;
  readonly tipoPuerta = this.state.tipoPuerta;

  readonly prediccion = this.state.prediccion;
  readonly confirmada = this.state.confirmada;
  readonly costoUnitario = this.state.costoUnitario;
  readonly markupActual = this.state.markupActual;
  readonly etiquetaMarkup = this.state.etiquetaMarkup;
  readonly precioUnitario = this.state.precioUnitario;
  readonly precioSugeridoTotal = this.state.precioSugeridoTotal;
  readonly aplicaDescuento = this.state.aplicaDescuento;

  readonly iniciales = this.state.iniciales;
  readonly getId = (obj: unknown): number => this.state.getId(obj);

  readonly irA = (n: number): void => this.state.irA(n);
  readonly siguiente = (): void => this.state.siguiente();
  readonly anterior = (): void => this.state.anterior();
  readonly buscarCliente = (event: Event): void => this.state.buscarCliente(event);
  readonly seleccionarCliente = (c: Cliente): void => this.state.seleccionarCliente(c);
  readonly limpiarCliente = (): void => this.state.limpiarCliente();
  readonly setId = (campo: keyof MuebleInput, valor: number): void =>
    this.state.setId(campo, valor);
  readonly setNum = (campo: keyof MuebleInput, valor: unknown): void =>
    this.state.setNum(campo, valor);
  readonly setText = (campo: keyof MuebleInput, event: Event): void =>
    this.state.setText(campo, event);
  readonly incrementar = (campo: CampoCantidad): void => this.state.incrementar(campo);
  readonly decrementar = (campo: CampoCantidad): void => this.state.decrementar(campo);
  readonly setTechoInclinado = (tipo: string): void => this.state.setTechoInclinado(tipo);
  readonly setColor = (nombre: string): void => this.state.setColor(nombre);
  readonly setTipoPuerta = (id: number): void => this.state.setTipoPuerta(id);
  readonly validarDimensiones = (): boolean => this.state.validarDimensiones();
  readonly predecir = (): void => this.state.predecir();
  readonly confirmar = (): void => this.state.confirmar();
  readonly nueva = (): void => this.state.reiniciar();

  ngOnInit(): void {
    this.state.inicializar();
  }

  irAlListado(): void {
    this.router.navigate(['/cotizaciones']);
  }
}
