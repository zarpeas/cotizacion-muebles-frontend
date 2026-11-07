import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.html',
  styleUrls: ['./pagination.css'],
})
export class PaginationComponent {
  protected readonly Math = Math;

  @Input() set page(value: number) {
    this.currentPage.set(value);
  }
  @Input() set totalPages(value: number) {
    this._totalPages.set(value);
  }
  @Input() totalItems = 0;
  @Input() pageSize = 10;

  @Output() pageChange = new EventEmitter<number>();

  readonly currentPage = signal(1);
  readonly _totalPages = signal(1);

  
  readonly paginas = computed(() => {
    const total = this._totalPages();
    const actual = this.currentPage();
    const rango = 2;

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const paginas: (number | string)[] = [];
    const inicio = Math.max(2, actual - rango);
    const fin = Math.min(total - 1, actual + rango);

    paginas.push(1);

    if (inicio > 2) paginas.push('...');

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }

    if (fin < total - 1) paginas.push('...');

    paginas.push(total);

    return paginas;
  });

  irA(pagina: number | string): void {
    if (pagina === '...') return;
    const p = pagina as number;
    if (p < 1 || p > this._totalPages()) return;
    if (p === this.currentPage()) return;
    this.pageChange.emit(p);
  }

  anterior(): void {
    if (this.currentPage() > 1) {
      this.pageChange.emit(this.currentPage() - 1);
    }
  }

  siguiente(): void {
    if (this.currentPage() < this._totalPages()) {
      this.pageChange.emit(this.currentPage() + 1);
    }
  }
}