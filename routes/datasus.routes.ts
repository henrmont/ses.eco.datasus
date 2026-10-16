import { Routes } from '@angular/router';
import { Professionals } from '../enums/professionals';
import { datasusGuard } from '../guards/datasus.guard';

export const datasusRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./../pages/index-page/index.page').then(m => m.IndexPage)
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./../pages/users-page/users.page').then(m => m.UsersPage),
    canActivate: [datasusGuard],
    data: { 
      permission: 'datasus/usuário listar', 
      types: [Professionals.ADMINISTRADOR] 
    }
  },
  {
    path: 'regras',
    loadComponent: () => import('./../pages/roles-page/roles.page').then(m => m.RolesPage),
    canActivate: [datasusGuard],
    data: { 
      permission: 'datasus/regra listar', 
      types: [Professionals.ADMINISTRADOR] 
    }
  },
  {
    path: 'sigtap',
    loadComponent: () => import('./../pages/sigtap-page/sigtap.page').then(m => m.SigtapPage),
    canActivate: [datasusGuard],
    data: { 
      permission: 'datasus/sigtap listar', 
      types: [Professionals.SIGTAP] 
    }
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];