import {
  defaultSoundSettings,
  normalizeSoundSettings,
} from "@/data/default-sound-settings";
import type { SoundSettings } from "@/types";

type BrowserWindowWithAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

type ToneOptions = {
  durationSeconds: number;
  frequency: number;
  volume: number;
  type?: OscillatorType;
};

let screenAudioContext: AudioContext | null = null;
let lastTypeTickAt = 0;
let screenSoundsUnlocked = false;
let currentSoundSettings = defaultSoundSettings;
let gameActiveAudio: HTMLAudioElement | null = null;
let roundAudio: HTMLAudioElement | null = null;

const getLoopingAudio = (
  currentAudio: HTMLAudioElement | null,
  source: string,
  volume: number
) => {
  if (typeof window === "undefined") {
    return null;
  }

  if (currentAudio) {
    return currentAudio;
  }

  const audio = new Audio(source);
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = volume;

  return audio;
};

export const configureScreenSounds = (
  settings: Partial<SoundSettings> | null | undefined
) => {
  currentSoundSettings = normalizeSoundSettings(settings);

  if (gameActiveAudio) {
    gameActiveAudio.volume = currentSoundSettings.musicVolume;
  }

  if (roundAudio) {
    roundAudio.volume = currentSoundSettings.musicVolume;
  }

  if (!currentSoundSettings.gameMusicEnabled) {
    pauseAudio(gameActiveAudio);
  }

  if (!currentSoundSettings.roundMusicEnabled) {
    pauseAudio(roundAudio, true);
  }
};

const playAudio = (audio: HTMLAudioElement | null) => {
  if (!audio) {
    return;
  }

  void audio.play().catch(() => undefined);
};

const pauseAudio = (audio: HTMLAudioElement | null, reset = false) => {
  if (!audio) {
    return;
  }

  audio.pause();

  if (reset) {
    audio.currentTime = 0;
  }
};

const getScreenAudioContext = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const browserWindow = window as BrowserWindowWithAudio;
  const AudioContextConstructor =
    window.AudioContext ?? browserWindow.webkitAudioContext;

  if (!AudioContextConstructor) {
    return null;
  }

  screenAudioContext ??= new AudioContextConstructor();

  return screenAudioContext;
};

const playTone = ({
  durationSeconds,
  frequency,
  volume,
  type = "sine",
}: ToneOptions) => {
  if (volume <= 0) {
    return;
  }

  const audioContext = getScreenAudioContext();

  if (!audioContext) {
    return;
  }

  const startTone = () => {
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + durationSeconds + 0.01);
  };

  if (audioContext.state === "suspended") {
    void audioContext.resume().then(startTone).catch(() => undefined);
    return;
  }

  startTone();
};

export const unlockScreenSounds = () => {
  if (screenSoundsUnlocked) {
    return;
  }

  const audioContext = getScreenAudioContext();

  if (!audioContext) {
    return;
  }

  const unlock = () => {
    screenSoundsUnlocked = true;
    gameActiveAudio = getLoopingAudio(
      gameActiveAudio,
      "/sounds/juego.mp3",
      currentSoundSettings.musicVolume
    );
    roundAudio = getLoopingAudio(
      roundAudio,
      "/sounds/ronda.mp3",
      currentSoundSettings.musicVolume
    );
    playTone({
      durationSeconds: 0.035,
      frequency: 520,
      volume: 0.018,
      type: "sine",
    });
  };

  if (audioContext.state === "suspended") {
    void audioContext.resume().then(unlock).catch(() => undefined);
    return;
  }

  unlock();
};

export const playQuestionTypeSound = (character: string) => {
  if (!currentSoundSettings.effectsEnabled) {
    return;
  }

  if (!character.trim()) {
    return;
  }

  const now = Date.now();

  if (now - lastTypeTickAt < 42) {
    return;
  }

  lastTypeTickAt = now;
  playTone({
    durationSeconds: 0.028,
    frequency: character === "¿" || character === "?" ? 1160 : 940,
    volume: 0.11 * currentSoundSettings.effectsVolume,
    type: "square",
  });
};

export const playAnswerRevealSound = (optionIndex: number) => {
  if (!currentSoundSettings.effectsEnabled) {
    return;
  }

  playTone({
    durationSeconds: 0.13,
    frequency: 360 + optionIndex * 105,
    volume: 0.2 * currentSoundSettings.effectsVolume,
    type: "triangle",
  });
};

export const playCountdownTickSound = () => {
  if (!currentSoundSettings.effectsEnabled) {
    return;
  }

  playTone({
    durationSeconds: 0.09,
    frequency: 920,
    volume: 0.32 * currentSoundSettings.effectsVolume,
    type: "square",
  });
};

export const setGameActiveSound = (active: boolean) => {
  gameActiveAudio = getLoopingAudio(
    gameActiveAudio,
    "/sounds/juego.mp3",
    currentSoundSettings.musicVolume
  );

  if (active && currentSoundSettings.gameMusicEnabled) {
    playAudio(gameActiveAudio);
    return;
  }

  pauseAudio(gameActiveAudio);
};

export const setRoundSound = (active: boolean) => {
  roundAudio = getLoopingAudio(
    roundAudio,
    "/sounds/ronda.mp3",
    currentSoundSettings.musicVolume
  );

  if (active && currentSoundSettings.roundMusicEnabled) {
    playAudio(roundAudio);
    return;
  }

  pauseAudio(roundAudio, true);
};

export const stopScreenLoopSounds = () => {
  pauseAudio(gameActiveAudio);
  pauseAudio(roundAudio, true);
};
