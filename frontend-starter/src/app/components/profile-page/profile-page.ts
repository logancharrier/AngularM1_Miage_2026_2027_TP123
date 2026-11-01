import { Component, inject, OnInit, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  imports: [ReactiveFormsModule, SlicePipe],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePageComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
  });

  get name() {
    return this.form.controls.name;
  }

  ngOnInit(): void {
    // Si un utilisateur est déjà en mémoire, pré-remplir le champ de formulaire
    const current = this.auth.currentUser();
    if (current) {
      this.form.setValue({ name: current.name });
    }
    // Chargement systématique du profil à jour depuis l'API /api/users/me
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.auth.profile().subscribe({
      next: (user) => {
        this.loading.set(false);
        console.debug('[ProfilePage] Profil chargé', user.id);
        this.form.setValue({ name: user.name });
      },
      error: (error: { error?: { message?: string } }) => {
        this.loading.set(false);
        console.error('[ProfilePage] Chargement impossible', error);
        this.errorMessage.set(error.error?.message ?? 'Impossible de charger le profil.');
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.auth.update(this.form.getRawValue().name).subscribe({
      next: (user) => {
        this.saving.set(false);
        console.debug('[ProfilePage] Profil enregistré', user.id);
        this.successMessage.set('Nom mis à jour avec succès !');
      },
      error: (error: { error?: { message?: string } }) => {
        this.saving.set(false);
        console.error('[ProfilePage] Enregistrement impossible', error);
        this.errorMessage.set(error.error?.message ?? 'Impossible de mettre à jour le profil.');
      },
    });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
