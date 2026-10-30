import { Pipe, PipeTransform } from '@angular/core';
import { formatoNumero } from './iconos';

/** {{ 1590 | numero }} → "1.590". */
@Pipe({ name: 'numero' })
export class NumeroPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    return valor === null || valor === undefined ? '' : formatoNumero(valor);
  }
}
