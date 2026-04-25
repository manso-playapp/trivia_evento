import type { SoundSettings } from "@/types";

export const defaultSoundSettings: SoundSettings = {
  gameMusicEnabled: true,
  roundMusicEnabled: true,
  effectsEnabled: true,
  musicVolume: 0.3,
  effectsVolume: 0.8,
};

export const normalizeSoundSettings = (
  settings: Partial<SoundSettings> | null | undefined
): SoundSettings => ({
  ...defaultSoundSettings,
  ...settings,
  musicVolume: Math.max(
    0,
    Math.min(1, settings?.musicVolume ?? defaultSoundSettings.musicVolume)
  ),
  effectsVolume: Math.max(
    0,
    Math.min(1, settings?.effectsVolume ?? defaultSoundSettings.effectsVolume)
  ),
});
