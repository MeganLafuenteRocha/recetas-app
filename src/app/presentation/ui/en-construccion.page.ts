import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Marcador temporal para secciones que aún no se construyen. */
@Component({
  selector: 'app-en-construccion',
  template: `
    <main class="pagina">
      <span class="icono">construction</span>
      <h2>{{ titulo() }}</h2>
      <p>Esta sección llega en una próxima sesión de trabajo.</p>
    </main>
  `,
  styles: `
    .pagina {
      min-height: calc(100dvh - 72px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 24px;
      text-align: center;
    }
    .icono {
      font-size: 44px;
      color: var(--dorado-500);
      background: var(--dorado-100);
      border-radius: 50%;
      padding: 14px;
    }
    h2 { margin: 8px 0 0; }
    p { color: var(--plomo-500); font-size: 13px; margin: 0; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnConstruccionPage {
  // withComponentInputBinding permite llenar esto desde data de la ruta
  readonly titulo = input<string>('Muy pronto');
}
