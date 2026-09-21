// admin.routes.ts
import { Routes } from '@angular/router';

export const datasusRoutes: Routes = [
    {
        path: '',
        loadComponent: () => import('./../pages/index-page/index-page').then( m => m.IndexPage)
    },
    {
        path: 'usuarios',
        loadComponent: () => import('./../pages/users-page/users.page').then( m => m.UsersPage),
        data: { permission: 'tfd/usuário listar' } // Adicionado
    },
    {
        path: 'regras',
        loadComponent: () => import('./../pages/roles-page/roles.page').then( m => m.RolesPage),
        data: { permission: 'tfd/regra listar' } // Adicionado
    },
    {
        path: 'sigtap',
        loadComponent: () => import('./../pages/sigtap-page/sigtap-page').then( m => m.SigtapPage),
        data: { permission: 'tfd/datasus listar' } // Adicionado
    },
];