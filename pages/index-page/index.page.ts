import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-index-page',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule
  ],
  templateUrl: './index.page.html',
  styleUrl: './index.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IndexPage {
  // ==========================================
  // Injeção de Dependências
  // ==========================================
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  // ==========================================
  // Métodos Acessíveis pelo Template
  // ==========================================
  protected openChangelogDialog(): void {
    // this.dialog.open(ChangelogDialogComponent, {
    //   width: '600px',
    //   autoFocus: false
    // });
  }

  protected downloadManual(): void {
    const link = document.createElement('a');
    link.href = 'assets/docs/manual_datasus_mt.pdf'; // Ajuste o caminho do arquivo do manual conforme necessário
    link.download = 'manual_datasus_mt.pdf';
    link.click();
  }

  protected openVideoTutorialDialog(): void {
    // this.dialog.open(VideoTutorialDialogComponent, {
    //   width: '800px',
    //   autoFocus: false
    // });
  }
}