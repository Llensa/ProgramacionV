import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'truncate', standalone: true })
export class TruncatePipe implements PipeTransform {
  transform(v: string | null | undefined, max = 120): string {
    if (!v) return '';
    return v.length > max ? v.slice(0, max - 1) + '…' : v;
  }
}
