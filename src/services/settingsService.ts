import { AppError } from '@/middleware/error';
import prisma from '@/prismaClient';
import { UpdateSettingsRequest } from '@/types';
import { UserSettings } from '@prisma/client';

export class SettingsService {
  /**
   * Get user settings
   */
  static async getUserSettings(userId: string): Promise<UserSettings> {
    let settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Create default settings if they don't exist
      settings = await prisma.userSettings.create({
        data: {
          userId: userId,
          pomodoroDuration: 25,
          shortBreakDuration: 5,
          longBreakDuration: 15,
          longBreakInterval: 4,
          autoStartBreaks: false,
          autoStartPomodoros: false,
          soundEnabled: true,
          desktopNotifications: true,
          emailNotifications: false,
          theme: 'light',
          language: 'en',
        },
      });
    }

    return settings;
  }

  /**
   * Update user settings
   */
  static async updateUserSettings(
    userId: string,
    data: UpdateSettingsRequest
  ): Promise<UserSettings> {
    // Validate settings values
    if (
      data.pomodoroDuration &&
      (data.pomodoroDuration < 1 || data.pomodoroDuration > 60)
    ) {
      throw new AppError(
        'Pomodoro duration must be between 1 and 60 minutes',
        400
      );
    }

    if (
      data.shortBreakDuration &&
      (data.shortBreakDuration < 1 || data.shortBreakDuration > 30)
    ) {
      throw new AppError(
        'Short break duration must be between 1 and 30 minutes',
        400
      );
    }

    if (
      data.longBreakDuration &&
      (data.longBreakDuration < 1 || data.longBreakDuration > 60)
    ) {
      throw new AppError(
        'Long break duration must be between 1 and 60 minutes',
        400
      );
    }

    if (
      data.longBreakInterval &&
      (data.longBreakInterval < 2 || data.longBreakInterval > 10)
    ) {
      throw new AppError(
        'Long break interval must be between 2 and 10 pomodoros',
        400
      );
    }

    if (data.theme && !['light', 'dark', 'auto'].includes(data.theme)) {
      throw new AppError('Theme must be light, dark, or auto', 400);
    }

    if (
      data.language &&
      !['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'].includes(
        data.language
      )
    ) {
      throw new AppError('Unsupported language', 400);
    }

    const updateData: any = {};

    if (data.pomodoroDuration !== undefined) {
      updateData.pomodoroDuration = data.pomodoroDuration;
    }
    if (data.shortBreakDuration !== undefined) {
      updateData.shortBreakDuration = data.shortBreakDuration;
    }
    if (data.longBreakDuration !== undefined) {
      updateData.longBreakDuration = data.longBreakDuration;
    }
    if (data.longBreakInterval !== undefined) {
      updateData.longBreakInterval = data.longBreakInterval;
    }
    if (data.autoStartBreaks !== undefined) {
      updateData.autoStartBreaks = data.autoStartBreaks;
    }
    if (data.autoStartPomodoros !== undefined) {
      updateData.autoStartPomodoros = data.autoStartPomodoros;
    }
    if (data.soundEnabled !== undefined) {
      updateData.soundEnabled = data.soundEnabled;
    }
    if (data.desktopNotifications !== undefined) {
      updateData.desktopNotifications = data.desktopNotifications;
    }
    if (data.emailNotifications !== undefined) {
      updateData.emailNotifications = data.emailNotifications;
    }
    if (data.theme !== undefined) {
      updateData.theme = data.theme;
    }
    if (data.language !== undefined) {
      updateData.language = data.language;
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        pomodoroDuration: data.pomodoroDuration || 25,
        shortBreakDuration: data.shortBreakDuration || 5,
        longBreakDuration: data.longBreakDuration || 15,
        longBreakInterval: data.longBreakInterval || 4,
        autoStartBreaks: data.autoStartBreaks || false,
        autoStartPomodoros: data.autoStartPomodoros || false,
        soundEnabled:
          data.soundEnabled !== undefined ? data.soundEnabled : true,
        desktopNotifications:
          data.desktopNotifications !== undefined
            ? data.desktopNotifications
            : true,
        emailNotifications: data.emailNotifications || false,
        theme: data.theme || 'light',
        language: data.language || 'en',
      },
    });

    return settings;
  }

  /**
   * Reset settings to default
   */
  static async resetToDefaults(userId: string): Promise<UserSettings> {
    const settings = await prisma.userSettings.update({
      where: { userId },
      data: {
        pomodoroDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        longBreakInterval: 4,
        autoStartBreaks: false,
        autoStartPomodoros: false,
        soundEnabled: true,
        desktopNotifications: true,
        emailNotifications: false,
        theme: 'light',
        language: 'en',
      },
    });

    return settings;
  }

  /**
   * Get available themes
   */
  static getAvailableThemes(): string[] {
    return ['light', 'dark', 'auto'];
  }

  /**
   * Get available languages
   */
  static getAvailableLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' },
      { code: 'it', name: 'Italiano' },
      { code: 'pt', name: 'Português' },
      { code: 'ru', name: 'Русский' },
      { code: 'ja', name: '日本語' },
      { code: 'ko', name: '한국어' },
      { code: 'zh', name: '中文' },
    ];
  }
}
