import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CotizacionService } from '../../services/cotizacion';
import { ToastService } from '../../../../shared/services/toast.service';

// ==========================================
// DEFINICIONES Y CLASES DEL GENERADOR DE PDF
// ==========================================

const PDF_ANCHOS = {
  r: [761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,761,556,556,222,556,333,1000,556,556,333,1000,667,333,1000,556,611,556,556,222,222,333,333,350,556,1000,333,1000,500,333,944,556,500,667,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500],
  b: [761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,761,278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,761,556,611,278,556,500,1000,556,556,333,1000,667,333,1000,611,611,611,611,278,278,500,500,350,556,1000,333,1000,556,333,944,611,500,667,278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,333,400,584,333,333,333,611,556,278,333,333,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556]
};

// Píxel transparente base64 para evitar el error de string cortado
const PDF_LOGO_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const PDF_IVA = 0.19;
const PDF_EMPRESA = { nombre: 'Guardarropia y Almacenaje Arraiza y Espinoza Ltda', rut: '76.255.110-1', correo: 'info@movilockers.cl', fonos: '+562 64691805 / +562 64691806', direccion: 'SAN FERNANDO 870, SAN BERNARDO, SANTIAGO, Chile' };
const PDF_GRIS = [110, 110, 110], PDF_ROJO = [237, 28, 36];
const PDF_WIN: any = { '€': 128, '…': 133, '‘': 145, '’': 146, '“': 147, '”': 148, '•': 149, '–': 150, '—': 151 };

const pdfBytes = (s: string) => { let o = ''; for (const ch of String(s)) { const c = ch.charCodeAt(0); o += String.fromCharCode(PDF_WIN[ch] || (c < 256 ? c : 63)); } return o; };
const pdfEsc = (s: string) => pdfBytes(s).replace(/([\\()])/g, '\\$1');
const pdfNum = (n: number) => (Math.round(n * 100) / 100).toString();

class PdfDoc {
  W = 595.28; H = 841.89;
  pages: any[] = []; links: any[] = []; cur: any; usaImagen = false; y0: any;
  constructor() { this.nuevaPagina(); }
  nuevaPagina() { this.cur = { c: [], l: [] }; this.pages.push(this.cur); }
  ancho(s: string, fuente: string, size: number) {
    const t = (fuente === 'F2' || fuente === 'F4') ? PDF_ANCHOS.b : PDF_ANCHOS.r;
    const b = pdfBytes(s); let w = 0;
    for (let i = 0; i < b.length; i++) w += t[b.charCodeAt(i)] || 556;
    return w * size / 1000;
  }
  color(c: number[]) { return c.map(v => pdfNum(v / 255)).join(' '); }
  texto(s: string, x: number, y: number, o: any = {}) {
    const f = o.f || 'F1', sz = o.size || 9, col = o.color || [0, 0, 0];
    const w = this.ancho(s, f, sz);
    const xx = o.align === 'r' ? x - w : o.align === 'c' ? x - w / 2 : x;
    this.cur.c.push(`BT ${this.color(col)} rg /${f} ${sz} Tf ${pdfNum(xx)} ${pdfNum(this.H - y)} Td (${pdfEsc(s)}) Tj ET`);
    if (o.sub) this.linea(xx, y + 1.6, xx + w, y + 1.6, col, 0.6);
    if (o.url) this.cur.l.push({ x: xx, y: this.H - y - 2, w, h: sz + 2, url: o.url });
    return w;
  }
  rect(x: number, y: number, w: number, h: number, col: number[]) {
    this.cur.c.push(`${this.color(col)} rg ${pdfNum(x)} ${pdfNum(this.H - y - h)} ${pdfNum(w)} ${pdfNum(h)} re f`);
  }
  linea(x1: number, y1: number, x2: number, y2: number, col = [0, 0, 0], grosor = 0.5) {
    this.cur.c.push(`${this.color(col)} RG ${grosor} w ${pdfNum(x1)} ${pdfNum(this.H - y1)} m ${pdfNum(x2)} ${pdfNum(this.H - y2)} l S`);
  }
  imagen(x: number, y: number, w: number, h: number) {
    this.usaImagen = true;
    this.cur.c.push(`q ${pdfNum(w)} 0 0 ${pdfNum(h)} ${pdfNum(x)} ${pdfNum(this.H - y - h)} cm /Im1 Do Q`);
  }
  rico(segs: any[], x: number, y: number, maxW: number, o: any = {}) {
    const size = o.size || 8.5, lh = o.lh || 12, col = o.color || [0, 0, 0];
    const palabras: any[] = [];
    segs.forEach(sg => String(sg.t).split(/(\s+)/).forEach(p => { if (p !== '') palabras.push({ t: p, f: sg.b ? 'F2' : (o.f || 'F1') }); }));
    let linea: any[] = [], w = 0;
    const volcar = () => {
      if (!linea.length) return;
      this.asegurar(lh, y); y = this.y0 !== undefined ? this.y0 : y;
      let xx = x;
      linea.forEach(p => { this.texto(p.t, xx, y, { f: p.f, size, color: col }); xx += this.ancho(p.t, p.f, size); });
      y += lh; linea = []; w = 0;
    };
    palabras.forEach(p => {
      const pw = this.ancho(p.t, p.f, size);
      if (/^\s+$/.test(p.t)) { if (linea.length) { linea.push(p); w += pw; } return; }
      if (w + pw > maxW && linea.length) { while (linea.length && /^\s+$/.test(linea[linea.length - 1].t)) linea.pop(); volcar(); }
      linea.push(p); w += pw;
    });
    volcar();
    return y;
  }
  asegurar(alto: number, y: number) {
    this.y0 = undefined;
    if (y + alto > this.H - 46) { this.nuevaPagina(); this.y0 = 50; }
  }
  generar(logoJpeg: any): Blob {
    const objs: any[] = [];
    const add = (s: string) => { objs.push(s); return objs.length; };
    add('<< /Type /Catalog /Pages 2 0 R >>');
    add('');
    ['Helvetica', 'Helvetica-Bold', 'Helvetica-Oblique', 'Helvetica-BoldOblique'].forEach(n => add(`<< /Type /Font /Subtype /Type1 /BaseFont /${n} /Encoding /WinAnsiEncoding >>`));
    let imObj = 0;
    if (logoJpeg) imObj = add(`<< /Type /XObject /Subtype /Image /Width ${logoJpeg.w} /Height ${logoJpeg.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoJpeg.bin.length} >>\nstream\n${logoJpeg.bin}\nendstream`);
    const kids: number[] = [];
    this.pages.forEach(pg => {
      const stream = pg.c.join('\n');
      const cont = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
      const annots = pg.l.map((l: any) => add(`<< /Type /Annot /Subtype /Link /Rect [${pdfNum(l.x)} ${pdfNum(l.y)} ${pdfNum(l.x + l.w)} ${pdfNum(l.y + l.h)}] /Border [0 0 0] /A << /S /URI /URI (${pdfEsc(l.url)}) >> >>`));
      const res = `<< /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R >>${imObj ? ` /XObject << /Im1 ${imObj} 0 R >>` : ''} >>`;
      kids.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.W} ${this.H}] /Resources ${res} /Contents ${cont} 0 R${annots.length ? ` /Annots [${annots.map((a: any) => a + ' 0 R').join(' ')}]` : ''} >>`));
    });
    objs[1] = `<< /Type /Pages /Count ${kids.length} /Kids [${kids.map(k => k + ' 0 R').join(' ')}] >>`;
    let out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'; const offs: number[] = [];
    objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
    const xref = out.length;
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('');
    out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    const u8 = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) u8[i] = out.charCodeAt(i) & 255;
    return new Blob([u8], { type: 'application/pdf' });
  }
}

// ==========================================
// COMPONENTE
// ==========================================

@Component({
  selector: 'app-detalle-cotizacion',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './detalle-cotizacion.html',
  styleUrl: './detalle-cotizacion.css'
})
export class DetalleCotizacion implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cotizacionService = inject(CotizacionService);
  private readonly toast = inject(ToastService);

  readonly cotizacion = signal<any>(null);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  readonly showCancelModal = signal(false);
  readonly cancelMotivo = signal('');
  readonly generandoPDF = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDetalle(Number(id));
    } else {
      this.router.navigate(['/cotizaciones']);
    }
  }

  cargarDetalle(id: number): void {
    this.cargando.set(true);
    this.error.set(null);
    this.cotizacionService.obtener(id).subscribe({
      next: (data) => {
        this.cotizacion.set(data);
        this.cargando.set(false);
      },
      error: (err: any) => {
        this.error.set('No se pudo cargar la cotización. ' + (err?.error?.message ?? ''));
        this.cargando.set(false);
      }
    });
  }

  volver(): void { this.router.navigate(['/cotizaciones']); }

  estadoClass(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'pendiente': return 'badge-pendiente';
      case 'aceptada':  return 'badge-aceptada';
      case 'rechazada': return 'badge-rechazada';
      case 'cancelada': return 'badge-cancelada';
      default:          return 'badge-default';
    }
  }

  aceptarCotizacion(): void {
    const c = this.cotizacion();
    if (!c) return;
    this.cotizacionService.aceptar(c.idCotizacion).subscribe({
      next: () => {
        this.toast.success('Cotización aceptada correctamente');
        this.cargarDetalle(c.idCotizacion);
      },
      error: (err: any) => this.toast.error('Error al aceptar: ' + (err?.error?.message ?? err.message))
    });
  }

  abrirModalCancelar(): void { this.cancelMotivo.set(''); this.showCancelModal.set(true); }
  cerrarModalCancelar(): void { this.showCancelModal.set(false); this.cancelMotivo.set(''); }

  confirmarCancelacion(): void {
    const c = this.cotizacion();
    if (!c) return;
    if (!this.cancelMotivo().trim()) {
      this.toast.error('Debes ingresar un motivo para cancelar.');
      return;
    }
    this.cotizacionService.cancelar(c.idCotizacion, this.cancelMotivo()).subscribe({
      next: () => {
        this.toast.success('Cotización cancelada correctamente');
        this.cerrarModalCancelar();
        this.cargarDetalle(c.idCotizacion); 
      },
      error: (err: any) => this.toast.error('Error al cancelar: ' + (err?.error?.message ?? err.message)),
    });
  }

  // ============ GENERAR PDF ============
  async generarPDF(): Promise<void> {
    const c = this.cotizacion();
    if (!c) return;

    this.generandoPDF.set(true);
    try {
      const logo = await this.pdfCargarLogo();
      const doc = new PdfDoc(), M = 40, R = doc.W - M, CW = R - M;

      const [dd, mm, aa] = c.fechaCotizacion.split('T')[0].split('-').map(Number);
      const creada = new Date(aa, mm - 1, dd), vence = new Date(creada); vence.setDate(vence.getDate() + 10);

      /* Encabezado */
      doc.texto('COTIZACION ' + c.numeroCotizacion, M, 52, { f: 'F2', size: 13, color: PDF_ROJO });
      if (logo) doc.imagen(R - 170, 26, 170, 170 * logo.h / logo.w);
      let y = 120;
      doc.texto(PDF_EMPRESA.nombre, R, y, { f: 'F2', size: 8.5, align: 'r' });
      [PDF_EMPRESA.rut, PDF_EMPRESA.correo, PDF_EMPRESA.fonos, PDF_EMPRESA.direccion].forEach(t => { y += 13; doc.texto(t, R, y, { size: 8.5, align: 'r' }); });
      doc.texto('# ' + c.numeroCotizacion, M, 131, { size: 8.5 });
      doc.texto('Fecha de creación ' + this.pdfFecha(creada), M, 144, { size: 8.5 });
      doc.texto('Fecha de vencimiento ' + this.pdfFecha(vence), M, 157, { size: 8.5 });

      /* Dirigido a */
      doc.texto('Dirigido a', M, 205, { size: 8.5, color: PDF_ROJO });
      doc.texto(String(c.clienteRazonSocial).toUpperCase(), M, 228, { f: 'F2', size: 8.5 });
      doc.texto(c.clienteCorreo || '', M, 241, { size: 8.5 });
      doc.texto(c.clienteTelefono || '', M, 254, { size: 8.5 });
      doc.texto(String(c.clienteRazonSocial).toUpperCase(), R, 236, { f: 'F2', size: 8.5, align: 'r' });
      doc.texto(c.clienteRut || '', R, 249, { size: 8.5, align: 'r' });

      /* Tabla */
      const X = { cant: 352, pu: 440, imp: 488, tot: R - 8 };
      y = 282;
      doc.rect(M, y, CW, 20, PDF_ROJO);
      const hd = { f: 'F2', size: 8.5, color: [255, 255, 255] };
      doc.texto('Producto', M + 8, y + 13.5, hd);
      doc.texto('Cant', X.cant, y + 13.5, { ...hd, align: 'c' });
      doc.texto('Precio unitario', X.pu, y + 13.5, { ...hd, align: 'r' });
      doc.texto('Impto.', X.imp, y + 13.5, { ...hd, align: 'r' });
      doc.texto('Total', X.tot, y + 13.5, { ...hd, align: 'r' });
      y += 20;

      const costoU = Math.round(c.costoFabricacion), venta = Math.round(c.precioVentaSugerido);
      doc.rect(M, y, CW, 20, [245, 245, 245]);
      doc.texto('Personalizado', M + 8, y + 13.5, { f: 'F2', size: 8.5 });
      doc.texto(String(c.cantidad), X.cant, y + 13.5, { size: 8.5, align: 'c' });
      doc.texto(this.pdfMonto(costoU), X.pu, y + 13.5, { size: 8.5, align: 'r' });
      doc.texto('19%', X.imp, y + 13.5, { size: 8.5, align: 'r' });
      doc.texto(this.pdfMonto(venta), X.tot, y + 13.5, { size: 8.5, align: 'r' });
      y += 36;
      
      y = this.pdfEspecificaciones(doc, c, M, y, CW);
      y += 4;
      doc.texto('* CONSULTE COSTO ADICIONAL ATRIBUTOS CIERRES Y COLORES.', M, y, { size: 8.5 });
      y += 26;

      /* Totales */
      const subtotal = venta, impuesto = Math.round(subtotal * PDF_IVA), total = subtotal + impuesto;
      const gris = [225, 225, 225];
      [['Subtotal', subtotal], ['Impuesto', impuesto], ['Total', total]].forEach(([k, v]: any) => {
        doc.linea(M, y - 12, R, y - 12, gris, 0.6);
        doc.texto(k, 497 - 40, y + 2, { f: 'F2', size: 8.5, align: 'r' });
        doc.texto(this.pdfMonto(v), X.tot, y + 2, { f: 'F2', size: 8.5, align: 'r' });
        y += 24;
      });
      doc.linea(M, y - 12, R, y - 12, gris, 0.6);
      y += 8;

      /* Textos comerciales */
      const T = { size: 8, color: PDF_GRIS }, P = (t: string, o: any = {}) => { y = doc.rico([{ t, b: o.b }], M, y, CW, { size: 8, lh: 11, color: PDF_GRIS, f: o.i ? 'F3' : 'F1' }); y += o.gap === undefined ? 8 : o.gap; };
      const H = (t: string) => { doc.asegurar(30, y); if (doc.y0 !== undefined) y = doc.y0; doc.texto(t, M, y, { f: 'F2', size: 8.5, color: PDF_GRIS }); y += 16; };
      
      doc.asegurar(40, y); if (doc.y0 !== undefined) y = doc.y0;
      doc.texto('Generado por: Julio Ortiz Perez, Asesor.', M, y, { size: 8, color: PDF_GRIS }); y += 18;
      H('Términos de compra:');
      doc.texto('* CONSULTE DEMAS LINEAS DE PRODUCTOS QUE PODEMOS OFRECER EN ', M, y, T);
      let ax = M + doc.ancho('* CONSULTE DEMAS LINEAS DE PRODUCTOS QUE PODEMOS OFRECER EN ', 'F1', 8);
      ax += doc.texto('www.movilockers.cl', ax, y, { size: 8, color: [20, 80, 190], sub: true, url: 'https://www.movilockers.cl' });
      ax += doc.texto(' y ', ax, y, T);
      doc.texto('www.rockers.cl', ax, y, { size: 8, color: [20, 80, 190], sub: true, url: 'https://www.rockers.cl' });
      y += 20;
      doc.texto('Te recordamos que la vigencia de esta cotización es de 7 días hábiles', M, y, { f: 'F2', size: 8, color: PDF_GRIS, sub: true }); y += 20;
      P('Plazo de Fabricación (aproximado): 20 A 25 DÍAS HÁBILES + COORDINACIÓN LOGÍSTICA.', { b: true });
      P('Los tiempos de despacho tendrán directa relación al: stock, volumen y complejidad del desarrollo de los productos.', { i: true, gap: 12 });
      H('Condiciones comerciales:');
      P('1°- Transferencia bancaria del 100%.', { gap: 2 });
      P('2°- 50% transferencia y 50% contra entrega.', { gap: 2 });
      P('3°- Crédito a 30 días (previa evaluación del área de finanzas).', { gap: 12 });
      doc.linea(M, y, M + 190, y, PDF_GRIS, 0.5); y += 20;
      doc.asegurar(20, y); if (doc.y0 !== undefined) y = doc.y0;
      doc.texto('Condiciones Generales', M, y, { f: 'F2', size: 8.5, color: PDF_GRIS, sub: true }); y += 20;

      const SEC = [
        ['1. Embalaje', ['- Producto se considera envuelto en film plástico como embalaje por defecto y su costo está incluido en el precio del producto. Se sugiere orientarse con su asesor para recomendación más idónea en caso que lo amerite, por ejemplo a regiones.', '- La empresa no se responsabiliza por embalajes mal proyectados por parte del cliente. Siempre recibirá la asesoría de nuestros especialistas para un óptimo traslado.']],
        ['2. Bodegaje:', ['- Dirección Bodega: San Fernando #870, Condominio Industrial Jardines del Sur, San Bernardo, Santiago.', '- Horario de atención: Lunes a Viernes de 09:00 a 16:30 horas.', '- Los retiros se deben coordinar con tu asesor al menos con 24 horas de anticipación, para reserva de hora en bodega.', '- Transcurridos 7 días hábiles posteriores a la confirmación de disponibilidad de retiro, se indicará a través del asesor el costo diario por metro cuadrado utilizado en nuestras bodegas.', '- Los imprevistos en mercadería post retiro por parte del cliente, no serán responsabilidad de MOVILOCKERS.']],
        ['3. Transporte, descarga y acopio:', ['- El costo de traslado corre por parte del comprador y debe ser cotizado con el asesor comercial.', '- Las fechas de entrega de mercadería, se considera en días hábiles de lunes a viernes de 09:00 a 17:00 horas.', '- La descarga de mercadería se considera de acuerdo a la naturaleza del proyecto.']],
        ['4. Garantías:', ['- Los productos cuentan con 24 meses de garantía por defectos de fabricación. Cualquier falla por mal uso, será cotizada su reparación o mantención.']]
      ];
      SEC.forEach(([t, ps]: any) => { H(t); ps.forEach((p: string) => P(p)); y += 4; });
      P('Si su proyecto considera INSTALACION, favor solicitar ANS (Acuerdo de Nivel de Servicio) para una mejor coordinación.', { gap: 14 });
      H('Información Bancaria');
      P('Si quieres pagar con transferencia lo puedes hacer a los siguientes datos:', { gap: 10 });
      ['Razón Social: Movilockers Ltda', 'RUT: 76.255.110-1', 'Banco: BCI', 'Cuenta Corriente: 81927801', 'correo: info@movilockers.cl'].forEach(t => P(t, { gap: 1 }));

      const blob = doc.generar(logo);
      const nombre = 'COTIZACION_' + c.numeroCotizacion + '_-_MOVILOCKERS.pdf';
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      
      this.toast.success('PDF generado correctamente');
    } catch (e) {
      console.error(e);
      this.toast.error('No se pudo generar el PDF');
    } finally {
      this.generandoPDF.set(false);
    }
  }

  // ============ HELPERS DEL PDF ============
  private pdfEspecificaciones(doc: any, c: any, M: number, y: number, CW: number) {
    const techo = c.techoInclinado ? 'Con techo inclinado' : 'Sin techo inclinado';
    y = doc.rico([{ t: `* ${String(c.categoria).toUpperCase()} INDUSTRIAL ${c.cantidadPuertas} ${c.cantidadPuertas === 1 ? 'PUERTA' : 'PUERTAS'} `, b: true }, { t: 'ALTA RESISTENCIA FABRICACION NACIONAL A PEDIDO MARCA MOVILOCKERS. ' }, { t: 'GARANTIA 24 MESES.', b: true }], M, y, CW, { size: 8.5, lh: 12 });
    y += 8;
    const filas = [
      ['Categoría', c.categoria, 'Cantidad', c.cantidad + (c.cantidad === 1 ? ' unidad' : ' unidades')],
      ['Medidas (alto × ancho × fondo)', `${c.altoCm} × ${c.anchoCm} × ${c.fondoCm} cm`, 'Espesor', c.espesor],
      ['Color', c.color, 'Cerradura', c.cerradura],
      ['Zócalo / Patas', c.base, 'Puertas', `${c.cantidadPuertas} puerta(s) (${c.tipoPuerta})`],
      ['Bandejas', c.cantidadBandejas + (c.cantidadBandejas === 1 ? ' bandeja' : ' bandejas'), 'Techo', techo]
    ];
    const gris = [110, 110, 110], mid = M + CW / 2 + 8;
    filas.forEach(f => {
      doc.texto(f[0].toUpperCase().replace('×', 'X'), M + 8, y, { size: 6.5, color: gris });
      doc.texto(f[2].toUpperCase(), mid, y, { size: 6.5, color: gris });
      doc.texto(String(f[1]).replace('×', 'x'), M + 8, y + 11, { f: 'F2', size: 8.5 });
      doc.texto(String(f[3]).replace('×', 'x'), mid, y + 11, { f: 'F2', size: 8.5 });
      y += 28;
    });
    return y;
  }

  private pdfFecha(d: Date) {
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return String(d.getDate()).padStart(2, '0') + ', ' + meses[d.getMonth()] + ', ' + d.getFullYear();
  }

  private pdfMonto(n: number) { return '$ ' + Math.round(n).toLocaleString('es-CL'); }

  private pdfCargarLogo(): Promise<any> {
    return new Promise(res => {
      const img = new Image();
      img.onload = () => {
        try {
          const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
          const cx = cv.getContext('2d'); cx!.fillStyle = '#fff'; cx!.fillRect(0, 0, cv.width, cv.height); cx!.drawImage(img, 0, 0);
          res({ w: cv.width, h: cv.height, bin: atob(cv.toDataURL('image/jpeg', 0.92).split(',')[1]) });
        } catch (e) { res(null); }
      };
      img.onerror = () => res(null);
      img.src = PDF_LOGO_PNG;
    });
  }
}