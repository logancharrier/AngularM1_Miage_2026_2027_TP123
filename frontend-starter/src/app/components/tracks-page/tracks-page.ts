import { Component, ElementRef, inject, OnDestroy, signal, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Track } from '../../shared/models/track.model';
import { TrackService } from '../../shared/services/track.service';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 Mo (conforme backend)
const ALLOWED_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/mp4',
  'audio/x-m4a',
]);
const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.mp4'];

@Component({
  selector: 'app-tracks-page',
  imports: [ReactiveFormsModule],
  templateUrl: './tracks-page.html',
  styleUrl: './tracks-page.css',
})
export class TracksPageComponent implements OnDestroy {
  private readonly service = inject(TrackService);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild('fileInput') private readonly fileInputRef?: ElementRef<HTMLInputElement>;

  // --- Signals d'état : Bibliothèque paginée (Mission 2) ---
  readonly tracks = signal<Track[]>([]);
  readonly page = signal(1);
  readonly pages = signal(1);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // --- Signals d'état : Upload & Progression (Mission 3 & 6) ---
  readonly uploading = signal(false);
  readonly uploadProgress = signal<number | null>(null);
  readonly uploadError = signal<string | null>(null);
  readonly uploadSuccess = signal<string | null>(null);
  readonly fileValidationError = signal<string | null>(null);
  readonly selectedFile = signal<File | null>(null);

  // --- Signals d'état : Suppression (Mission 5) ---
  readonly deletingId = signal<string | null>(null);

  // --- Signals d'état : Lecteur audio sécurisé (Mission 3) ---
  readonly currentTrack = signal<Track | null>(null);
  readonly audioLoading = signal(false);
  readonly audioError = signal<string | null>(null);
  readonly audioUrl = signal('');

  readonly title = new FormControl('', { nonNullable: true });

  constructor() {
    this.load();
  }

  ngOnDestroy(): void {
    // Libération de la mémoire navigateur du dernier Blob audio
    this.revokeCurrentAudioUrl();
  }

  /**
   * Validation côté client du fichier sélectionné (taille, type MIME et extension)
   */
  choose(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    this.uploadError.set(null);
    this.uploadSuccess.set(null);
    this.fileValidationError.set(null);
    this.uploadProgress.set(null);

    if (!file) {
      this.selectedFile.set(null);
      return;
    }

    // 1. Contrôle taille (<= 25 Mo)
    if (file.size > MAX_FILE_SIZE) {
      this.fileValidationError.set(
        `Le fichier dépasse la taille maximale autorisée (25 Mo). Taille actuelle : ${this.formatSize(file.size)}.`,
      );
      this.selectedFile.set(null);
      input.value = '';
      return;
    }

    // 2. Contrôle type MIME et extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const isMimeValid = file.type ? ALLOWED_MIME_TYPES.has(file.type) : false;
    const isExtValid = ALLOWED_EXTENSIONS.includes(ext);

    if (!isMimeValid && !isExtValid) {
      this.fileValidationError.set(
        'Format de fichier non accepté. Formats autorisés : MP3, WAV, OGG, M4A.',
      );
      this.selectedFile.set(null);
      input.value = '';
      return;
    }

    this.selectedFile.set(file);

    // Pré-remplit le titre s'il est vide avec le nom du fichier sans extension
    if (!this.title.value.trim()) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      this.title.setValue(baseName);
    }
  }

  /**
   * Charge une page de morceaux via le TrackService
   */
  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.list(this.page(), 5).subscribe({
      next: (response) => {
        this.tracks.set(response.items);
        this.page.set(response.page);
        this.pages.set(response.pages);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[TracksPage] Chargement impossible', err);
        this.error.set('Impossible de charger la bibliothèque de pistes.');
        this.loading.set(false);
      },
    });
  }

  /**
   * Navigation paginée vers une page cible
   */
  go(targetPage: number): void {
    if (targetPage < 1 || targetPage > this.pages() || targetPage === this.page()) {
      return;
    }
    this.page.set(targetPage);
    this.load();
  }

  /**
   * Envoi du fichier audio avec suivi de progression en temps réel (Mission 6)
   */
  upload(): void {
    const file = this.selectedFile();
    if (!file || this.uploading()) return;

    this.uploading.set(true);
    this.uploadProgress.set(0);
    this.uploadError.set(null);
    this.uploadSuccess.set(null);

    const trackTitle = this.title.value.trim() || file.name;

    this.service.upload(file, trackTitle).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          if (event.total) {
            const percent = Math.round((100 * event.loaded) / event.total);
            this.uploadProgress.set(percent);
          }
        } else if (event.type === HttpEventType.Response) {
          const track = event.body as Track;
          this.uploadProgress.set(100);
          this.uploadSuccess.set(`Piste « ${track?.title || trackTitle} » ajoutée avec succès !`);
          this.showSnackbar('success', `Piste « ${track?.title || trackTitle} » ajoutée avec succès.`);
          this.uploading.set(false);
          this.uploadProgress.set(null);

          // Vider le formulaire
          this.title.setValue('');
          this.selectedFile.set(null);
          if (this.fileInputRef?.nativeElement) {
            this.fileInputRef.nativeElement.value = '';
          }

          // Revenir à la première page et actualiser la liste
          this.page.set(1);
          this.load();
        }
      },
      error: (err) => {
        console.error('[TracksPage] Envoi impossible', err);
        const serverMsg = err.error?.message || "Erreur lors de l'envoi de la piste.";
        this.uploadError.set(serverMsg);
        this.showSnackbar('error', serverMsg);
        this.uploading.set(false);
        this.uploadProgress.set(null);
      },
    });
  }

  /**
   * Récupère le Blob audio authentifié et génère un ObjectURL pour la lecture
   */
  play(track: Track): void {
    if (this.currentTrack()?.id === track.id && this.audioUrl()) {
      return;
    }

    // La piste précédente est libérée avant de télécharger la nouvelle
    this.revokeCurrentAudioUrl();
    this.audioLoading.set(true);
    this.audioError.set(null);
    this.currentTrack.set(track);

    this.service.audio(track.id).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.audioUrl.set(objectUrl);
        this.audioLoading.set(false);
      },
      error: (err) => {
        console.error('[TracksPage] Lecture impossible', err);
        this.audioError.set(`Impossible de lire le morceau « ${track.title} ».`);
        this.audioLoading.set(false);
      },
    });
  }

  /**
   * Erreur de décodage ou de lecture du Blob par le navigateur
   */
  onAudioError(): void {
    if (!this.audioUrl()) return;
    this.revokeCurrentAudioUrl();
    this.audioError.set(
      "Le fichier audio n'a pas pu être lu. Il est peut-être incomplet ou corrompu.",
    );
  }

  /**
   * Suppression sécurisée d'une piste avec confirmation et gestion d'état (Mission 5)
   */
  deleteTrack(track: Track, event?: Event): void {
    event?.stopPropagation();

    // Empêche les doubles soumissions ou actions multiples
    if (this.deletingId() !== null) return;

    if (!confirm(`Supprimer définitivement la piste « ${track.title} » ?`)) {
      return;
    }

    this.deletingId.set(track.id);

    // Si on supprime la piste en cours de lecture, on stoppe la lecture
    if (this.currentTrack()?.id === track.id) {
      this.revokeCurrentAudioUrl();
      this.currentTrack.set(null);
    }

    this.service.delete(track.id).subscribe({
      next: () => {
        this.uploadSuccess.set(null);
        this.showSnackbar('success', `Piste « ${track.title} » supprimée.`);
        this.deletingId.set(null);

        // Si on était sur la dernière page et qu'il ne restait qu'un élément, on recule d'une page
        if (this.tracks().length === 1 && this.page() > 1) {
          this.page.set(this.page() - 1);
        }
        this.load();
      },
      error: (err) => {
        console.error('[TracksPage] Erreur suppression', err);
        this.deletingId.set(null);

        // Gestion du cas où la piste n'existe plus ou n'appartient pas à l'utilisateur
        if (err.status === 404) {
          this.showSnackbar('error', "Cette piste a déjà été supprimée ou est introuvable.");
        } else if (err.status === 403) {
          this.showSnackbar('error', "Vous n'avez pas l'autorisation de supprimer cette piste.");
        } else {
          this.showSnackbar('error', err.error?.message || 'Erreur lors de la suppression.');
        }

        // Rafraîchir pour synchroniser avec l'état réel du serveur
        this.load();
      },
    });
  }

  showSnackbar(type: 'success' | 'error', text: string): void {
    this.snackBar.open(text, 'Fermer', {
      duration: 4500,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error',
    });
  }

  private revokeCurrentAudioUrl(): void {
    const current = this.audioUrl();
    if (current) {
      URL.revokeObjectURL(current);
      this.audioUrl.set('');
    }
  }

  // --- Formatters d'affichage lisibles ---

  formatSize(bytes: number): string {
    if (!bytes && bytes !== 0) return '0 Ko';
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  }

  formatBadge(mimeType: string, filename: string): string {
    if (mimeType.includes('mpeg') || filename.endsWith('.mp3')) return 'MP3';
    if (mimeType.includes('wav') || filename.endsWith('.wav')) return 'WAV';
    if (mimeType.includes('ogg') || filename.endsWith('.ogg')) return 'OGG';
    if (mimeType.includes('mp4') || mimeType.includes('m4a') || filename.endsWith('.m4a')) return 'M4A';
    return 'AUDIO';
  }
}
