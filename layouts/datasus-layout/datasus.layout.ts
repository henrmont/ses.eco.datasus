import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild, DestroyRef, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

// Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogRef, MatDialogModule } from '@angular/material/dialog';

// Serviços e Componentes
import { MessageService } from '../../../core/services/message-service';
import { LoadingComponent } from '../../../core/components/loading-component/loading-component';
import { SigtapService } from '../../services/sigtap.service';

// Modais (Dialogs)
import { UserCreateComponent } from '../../components/users/user-create/user-create.component';
import { RoleCreateComponent } from '../../components/roles/role-create/role-create.component';

// Nomes dos canais do módulo TFD
type DatasusChannelKey = 'ROLES' | 'USERS' | 'SIGTAP';

const DATASUS_CHANNEL_NAMES: Record<DatasusChannelKey, string> = {
  ROLES: 'datasus-roles-channel',
  USERS: 'datasus-users-channel',
  SIGTAP: 'datasus-sigtap-channel',
};

interface MenuItem {
  label: string;
  icon: string;
  permissions: string[];
  routerLink?: string[];
  action?: () => void;
}

interface MenuGroup {
  subHeader: string;
  requiredRoles: string[];
  items: MenuItem[];
}

@Component({
  selector: 'app-datasus-layout',
  standalone: true,
  imports: [
    CommonModule, 
    MatSidenavModule, 
    MatListModule, 
    MatIconModule, 
    RouterModule, 
    MatMenuModule,
    MatDialogModule
  ],
  templateUrl: './datasus.layout.html',
  styleUrl: './datasus.layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasusLayout implements OnInit, OnDestroy {
  // 🔒 Injeções de dependência
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly messageService = inject(MessageService);
  private readonly sigtapService = inject(SigtapService);
  private readonly destroyRef = inject(DestroyRef);

  // Captura do input HTML
  protected readonly competence = viewChild.required<ElementRef>('competence');
  
  private loadingDialog!: MatDialogRef<LoadingComponent>;
  private readonly selectedFile = signal<File | null>(null);

  // 📡 Mapa de instâncias dos BroadcastChannels do TFD
  private readonly channels = new Map<DatasusChannelKey, BroadcastChannel>();

  // ==========================================
  // Ciclo de Vida (Inicialização e Finalização dos Canais)
  // ==========================================
  ngOnInit(): void {
    // Instancia todos os canais quando o layout é carregado
    (Object.keys(DATASUS_CHANNEL_NAMES) as DatasusChannelKey[]).forEach(key => {
      this.channels.set(key, new BroadcastChannel(DATASUS_CHANNEL_NAMES[key]));
    });
  }

  ngOnDestroy(): void {
    // Finaliza TODOS os canais de uma vez quando o usuário SAI do TfdLayout
    this.channels.forEach(channel => channel.close());
    this.channels.clear();
  }

  /**
   * Método auxiliar para emitir mensagens com segurança no canal especificado
   */
  public postMessage(channelKey: DatasusChannelKey, message: any = 'update'): void {
    const channel = this.channels.get(channelKey);
    if (channel) {
      channel.postMessage(message);
    }
  }

  // ==========================================
  // Métodos do Template
  // ==========================================
  protected checkPermission(names: string[]): boolean {
    const module = this.route.snapshot.routeConfig?.path;
    const roles = this.route.parent?.snapshot.data['user']?.roles || [];
    
    return roles.some((role: any) => {
      const permissions: string[] = role.permissions?.map((p: any) => p.name) || [];
      return names.some(name => permissions.includes(`${module}/${name}`));
    });
  }

  protected importCompetence(): void {
    this.competence().nativeElement.click();
  }

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (files && files.length > 0 && files[0].type === 'application/zip') {
      this.openLoading();
      this.selectedFile.set(files[0]);
      
      this.sigtapService.process(this.selectedFile()!)
        .pipe(
          finalize(() => {
            if (this.loadingDialog) this.loadingDialog.close();
            input.value = '';
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (response) => {
            this.messageService.showMessage(response.message);
            this.postMessage('SIGTAP', 'update');
          },
          error: (error) => {
            const fallbackError = error?.error?.message || 'Erro ao processar arquivo';
            this.messageService.showMessage(fallbackError);
          },
        });
    } else {
      input.value = '';
    }
  }

  private openLoading(): void {
    this.loadingDialog = this.dialog.open(LoadingComponent, {
      height: '200px',
      disableClose: true,
      autoFocus: false,
    });
  }

  private openDialog(component: any, width = '500px', height = 'auto', channelKey?: DatasusChannelKey): void {
    this.dialog.open(component, {
      width,
      height,
      disableClose: true,
      autoFocus: false,
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result && channelKey) {
          this.postMessage(channelKey, 'update');
        }
      });
  }

  // --- MENU DO TEMPLATE HTML ---
  protected readonly menuGroups: MenuGroup[] = [
    {
      subHeader: 'Usuários',
      requiredRoles: ['usuário listar', 'usuário criar'],
      items: [
        { label: 'Usuários', icon: 'groups', permissions: ['usuário listar'], routerLink: ['usuarios'] },
        { label: 'Novo usuário', icon: 'person_add', permissions: ['usuário criar'], action: () => this.userCreate() }
      ]
    },
    {
      subHeader: 'Regras',
      requiredRoles: ['regra listar', 'regra criar'],
      items: [
        { label: 'Regras', icon: 'security', permissions: ['regra listar'], routerLink: ['regras'] },
        { label: 'Nova regra', icon: 'add_moderator', permissions: ['regra criar'], action: () => this.roleCreate() }
      ]
    },
    {
      subHeader: 'Sigtap',
      requiredRoles: ['sigtap listar', 'sigtap importar'],
      items: [
        { label: 'Sigtap', icon: 'medical_services', permissions: ['sigtap listar'], routerLink: ['sigtap'] },
        { label: 'Importar competência', icon: 'upload', permissions: ['sigtap importar'], action: () => this.importCompetence() }
      ]
    },
  ];

  // --- MÉTODOS DE AÇÃO DO TEMPLATE HTML ---
  protected userCreate(): void {
    this.openDialog(UserCreateComponent, '700px', 'auto', 'USERS');
  }

  protected roleCreate(): void {
    this.openDialog(RoleCreateComponent, '900px', 'auto', 'ROLES');
  }
  
}