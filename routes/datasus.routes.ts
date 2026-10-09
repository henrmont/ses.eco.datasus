import { Routes } from '@angular/router';
import { Professionals } from '../enums/professionals';
import { professionalGuard } from '../../core/guards/professional-guard';

export const datasusRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./../pages/index-page/index.page').then(m => m.IndexPage)
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./../pages/users-page/users.page').then(m => m.UsersPage),
    canActivate: [professionalGuard],
    data: { 
      permission: 'datasus/usuário listar', 
      types: [Professionals.ADMINISTRADOR] 
    }
  },
  {
    path: 'regras',
    loadComponent: () => import('./../pages/roles-page/roles.page').then(m => m.RolesPage),
    canActivate: [professionalGuard],
    data: { 
      permission: 'datasus/regra listar', 
      types: [Professionals.ADMINISTRADOR] 
    }
  },
  {
    path: 'sigtap',
    loadComponent: () => import('./../pages/sigtap-page/sigtap.page').then(m => m.SigtapPage),
    canActivate: [professionalGuard],
    data: { 
      permission: 'datasus/sigtap listar', 
      types: [Professionals.ADMINISTRADOR] 
    }
  },
];