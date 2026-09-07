import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    SETTINGS_UPDATED: 'Paramètres modifiés avec succès.',
    NETWORK_SETTINGS: 'Paramètres Réseau',
    SETTINGS_EMAIL_NOTIFICATIONS: 'Activer les notifications par email',
  },
  en: {
    SETTINGS_UPDATED: 'Settings updated successfully.',
    NETWORK_SETTINGS: 'Network settings',
    SETTINGS_EMAIL_NOTIFICATIONS: 'Enable email notifications',
  },
  ar: {
    SETTINGS_UPDATED: 'تم تحديث الإعدادات بنجاح.',
    NETWORK_SETTINGS: 'إعدادات الشبكة',
    SETTINGS_EMAIL_NOTIFICATIONS: 'تفعيل إشعارات البريد الإلكتروني',
  },
  es: {
    SETTINGS_UPDATED: 'Ajustes actualizados con éxito.',
    NETWORK_SETTINGS: 'Ajustes de red',
    SETTINGS_EMAIL_NOTIFICATIONS: 'Activar notificaciones por correo electrónico',
  },
  it: {
    SETTINGS_UPDATED: 'Impostazioni aggiornate con successo.',
    NETWORK_SETTINGS: 'Impostazioni di rete',
    SETTINGS_EMAIL_NOTIFICATIONS: 'Attiva le notifiche email',
  },
  de: {
    SETTINGS_UPDATED: 'Einstellungen erfolgreich aktualisiert.',
    NETWORK_SETTINGS: 'Netzwerkeinstellungen',
    SETTINGS_EMAIL_NOTIFICATIONS: 'E-Mail-Benachrichtigungen aktivieren',
  },
})

langHelper.setLanguage(strings)
export { strings }
