import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DatasusUser } from '../models/user.model';
import { AuthService as CoreAuthService } from '../../core/services/auth-service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly coreAuthService = inject(CoreAuthService);
  private readonly apiUrl = `${environment.apiDatasusUrl}/users/me`;

  // 🔒 Estado reativo do DatasusUser
  private readonly _currentUser = signal<DatasusUser | null>(null);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this._currentUser());

  // ➔ Computed resiliente para os tipos profissionais
  readonly userProfessionalTypes = computed<string[]>(() => {
    const user = this._currentUser();
    const professional = user?.professional;
    if (!professional) return [];

    const rawTypes = (professional as any)?.types || (professional as any)?.type || [];
    const typesList = Array.isArray(rawTypes) ? rawTypes : [rawTypes];

    return typesList
      .map((item: any) => (typeof item === 'string' ? item : item?.type || item?.name || ''))
      .filter((type): type is string => Boolean(type))
      .map((type) => type.trim());
  });

  setCurrentUser(user: DatasusUser | null): void {
    this._currentUser.set(user);
    // Atualiza o core AuthService para manter sincronizado com o sistema
    this.coreAuthService.setCurrentUser(user);
  }

  getCurrentUser(): DatasusUser | null {
    return this._currentUser() || this.coreAuthService.getCurrentUser<DatasusUser>();
  }

  getMe(): Observable<DatasusUser> {
    return this.http.get<DatasusUser>(this.apiUrl).pipe(
      tap((user) => this.setCurrentUser(user))
    );
  }

  clearDatasusSession(): void {
    this._currentUser.set(null);
  }
}