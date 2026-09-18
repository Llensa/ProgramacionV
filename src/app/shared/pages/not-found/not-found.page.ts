import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Pantalla mostrada por la ruta comodin cuando ninguna otra coincide */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found.page.html',
  styleUrl: './not-found.page.css',
})
export class NotFoundPage {}
