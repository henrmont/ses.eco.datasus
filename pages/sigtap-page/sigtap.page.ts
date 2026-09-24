import { ChangeDetectionStrategy, Component, DestroyRef, Injector, inject, OnDestroy, OnInit, viewChild, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

// Angular Material & CDK
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

// Core & Models
import { LoadingComponent } from '../../../core/components/loading-component/loading-component';
import { Permission } from '../../models/permission.model';
import { Role } from '../../models/role.model';
import { User } from '../../models/user.model';
import { SigtapService } from '../../services/sigtap.service';

@Component({
  selector: 'app-sigtap-page',
  standalone: true,
  imports: [
    MatButtonModule, 
    MatFormFieldModule, 
    MatIconModule, 
    MatInputModule, 
    MatPaginatorModule, 
    MatSortModule, 
    MatTableModule, 
    MatTooltipModule
  ],
  templateUrl: './sigtap.page.html',
  styleUrl: './sigtap.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SigtapPage implements OnInit, OnDestroy {
  // Canal de sincronização
  private readonly sigtapChannel = new BroadcastChannel('datasus-sigtap-channel');

  // ==========================================
  // Injeção de Dependências
  // ==========================================
  private readonly sigtapService = inject(SigtapService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  // ==========================================
  // ViewChildren / Elementos da View
  // ==========================================
  private readonly sigtapSort = viewChild<MatSort>('sigtapSort');
  private readonly sigtapPaginator = viewChild<MatPaginator>('sigtapPaginator');

  // ==========================================
  // Propriedades e Estado Reativo
  // ==========================================
  private loadingDialog!: MatDialogRef<LoadingComponent>;
  private readonly currentUser: User | undefined = this.route.parent?.parent?.snapshot.data['user'];

  protected readonly displayedColumns: string[] = ['competence', 'actions'];
  protected readonly dataSource = new MatTableDataSource<any>([]);

  // ==========================================
  // Ciclo de Vida (Hooks)
  // ==========================================
  ngOnInit(): void {
    this.setupTableBindings();
    this.fetchCompetences(true);
    this.listenToBroadcastChannel();
  }

  ngOnDestroy(): void {
    this.sigtapChannel.close();
  }

  // ==========================================
  // Métodos Acessíveis pelo Template (Protected)
  // ==========================================
  protected applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  protected checkPermissions(permissionName: string): boolean {
    if (!this.currentUser?.roles) return true;

    const hasPermission = this.currentUser.roles.some((role: Role) =>
      role.permissions?.some((perm: Permission) => perm.name === permissionName)
    );

    return !hasPermission;
  }

  protected formatCompetence(name: string): string {
    if (!name || name.length < 6) return name || '';
    return `${name.substring(4, 6)}/${name.substring(0, 4)}`;
  }

  // ==========================================
  // Métodos Privados / Auxiliares
  // ==========================================
  private setupTableBindings(): void {
    effect(() => {
      const sort = this.sigtapSort();
      const paginator = this.sigtapPaginator();

      if (sort) this.dataSource.sort = sort;
      if (paginator) this.dataSource.paginator = paginator;
    }, { injector: this.injector });
  }

  private fetchCompetences(showLoading = false): void {
    if (showLoading) this.openLoading();

    this.sigtapService.getCompetences()
      .pipe(
        finalize(() => {
          if (showLoading && this.loadingDialog) {
            this.loadingDialog.close();
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.dataSource.data = response || [];
        },
        error: () => {
          this.dataSource.data = [];
        }
      });
  }

  private listenToBroadcastChannel(): void {
    this.sigtapChannel.onmessage = (message: MessageEvent<string>) => {
      if (message.data === 'update') {
        this.fetchCompetences(false);
      }
    };
  }

  private openLoading(): void {
    this.loadingDialog = this.dialog.open(LoadingComponent, {
      height: '200px',
      disableClose: true,
      autoFocus: false,
    });
  }
}