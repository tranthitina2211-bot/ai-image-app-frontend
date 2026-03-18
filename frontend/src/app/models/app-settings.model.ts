export type AppTheme = 'dark' | 'light' | 'system';
export type GridSize = 'small' | 'medium' | 'large';
export type DefaultRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
export type UserGender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface UserProfileSettings {
  displayName: string;
  gender: UserGender;
  birthYear: number | null;
  phone: string;
  avatarUrl: string;
}

export interface AppSettings {
  profile: UserProfileSettings;

  theme: AppTheme;
  gridSize: GridSize;
  autoplayVideoPreview: boolean;
  confirmBeforeDelete: boolean;

  defaultRatio: DefaultRatio;
  autoOpenResult: boolean;
  autoSavePrompt: boolean;
}
