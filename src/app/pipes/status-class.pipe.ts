import { Pipe, PipeTransform } from '@angular/core';
import { status } from '../models/produto/produto.component';

@Pipe({
  name: 'statusClass',
  standalone: true
})
export class StatusClassPipe implements PipeTransform {
  transform(value: status): string {
    switch (value) {
      case status.PENDENTE:
        return 'pendente';
      case status.CONCLUIDA:
        return 'concluida';
      case status.CANCELADA:
        return 'cancelada';
      default:
        return '';
    }
  }
}
