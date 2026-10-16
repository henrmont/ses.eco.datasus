import { inject, isDevMode } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { MessageService } from '../../core/services/message-service';
import { DatasusUser } from '../models/user.model';

export const datasusGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
): Observable<boolean | UrlTree> => {
  const router = inject(Router);
  const messageService = inject(MessageService);
  const authService = inject(AuthService);

  const currentUser = authService.getCurrentUser();

  // 1. Se já está na memória com o perfil profissional carregado, valida direto
  if (currentUser?.professional) {
    return of(validateDatasusUser(currentUser, route, router, messageService));
  }

  // 2. Senão, busca no backend via AuthService do DataSUS
  return authService.getMe().pipe(
    map((datasusUser: DatasusUser) => {
      return validateDatasusUser(datasusUser, route, router, messageService);
    }),
    catchError((error) => {
      if (isDevMode()) {
        console.error('[DatasusGuard] Erro ao buscar DatasusUser:', error);
      }
      messageService.showMessage('Falha ao carregar permissões do módulo DataSUS.');
      return of(router.parseUrl('/principal/dashboard'));
    })
  );
};

function validateDatasusUser(
  user: DatasusUser,
  route: ActivatedRouteSnapshot,
  router: Router,
  messageService: MessageService
): boolean | UrlTree {
  const requiredTypes = (route.data['types'] as string[]) || [];
  const requiredPermissions = (
    route.data['permissions'] || 
    (route.data['permission'] ? [route.data['permission']] : [])
  ) as string[];

  // Validar tipos profissionais
  const rawTypes = (user.professional as any)?.types || (user.professional as any)?.type || [];
  const typesList = Array.isArray(rawTypes) ? rawTypes : [rawTypes];

  const userTypes: string[] = typesList
    .map((item: any) => (typeof item === 'string' ? item : item?.type || item?.name || ''))
    .filter((type): type is string => Boolean(type))
    .map((type) => type.trim().toLowerCase());

  const hasValidType =
    requiredTypes.length === 0 ||
    requiredTypes.some((required) => {
      const reqTarget = required.trim().toLowerCase();
      return userTypes.some((uType) => uType === reqTarget || uType.includes(reqTarget) || reqTarget.includes(uType));
    });

  if (!hasValidType) {
    if (isDevMode()) {
      console.warn('[DatasusGuard] Perfil negado. Tipos do usuário:', userTypes, 'Exigidos:', requiredTypes);
    }
    messageService.showMessage('Seu perfil profissional não possui acesso a este recurso do DataSUS.');
    // ➔ Redireciona para a index do DataSUS
    return router.parseUrl('/principal/datasus');
  }

  // Validar permissões
  if (requiredPermissions.length > 0) {
    const roles = user.roles || [];
    const userPermissions = new Set<string>(
      roles
        .flatMap((role) => role.permissions || [])
        .map((p) => p.name?.trim().toLowerCase())
        .filter((name): name is string => Boolean(name))
    );

    const hasValidPermission = requiredPermissions.some((requiredPerm) => {
      const target = requiredPerm.trim().toLowerCase();
      return userPermissions.has(target) || userPermissions.has(`datasus/${target}`);
    });

    if (!hasValidPermission) {
      if (isDevMode()) {
        console.warn('[DatasusGuard] Permissão negada:', Array.from(userPermissions), 'Exigidas:', requiredPermissions);
      }
      messageService.showMessage('Você não possui a permissão necessária para acessar esta página do DataSUS.');
      // ➔ Redireciona para a index do DataSUS
      return router.parseUrl('/principal/datasus');
    }
  }

  return true;
}