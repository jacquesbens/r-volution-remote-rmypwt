
import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';

export const useNativeAlert = () => {
  const [isShowing, setIsShowing] = useState(false);

  const showAlert = useCallback((title: string, message?: string, buttons?: Array<{text: string, onPress?: () => void, style?: 'default' | 'cancel' | 'destructive'}>) => {
    console.log(`🚨 Alert requested: ${title} - ${message} (Platform: ${Platform.OS})`);
    
    if (isShowing) {
      console.log('⚠️ Alert already showing, ignoring new request');
      return;
    }

    setIsShowing(true);

    // Fonction pour réinitialiser l'état après un délai
    const resetState = () => {
      setTimeout(() => setIsShowing(false), 100);
    };

    // Gestion spéciale pour l'environnement web/Preview
    if (Platform.OS === 'web') {
      try {
        // Essayer d'abord Alert React Native
        Alert.alert(
          title,
          message,
          buttons || [{ text: 'OK', style: 'default', onPress: resetState }],
          { 
            cancelable: true,
            userInterfaceStyle: 'light',
            onDismiss: resetState
          }
        );
      } catch (alertError) {
        console.log(`⚠️ React Native Alert failed on web, using native alert:`, alertError);
        // Fallback vers alert natif du navigateur
        try {
          if (typeof window !== 'undefined' && window.alert) {
            const fullMessage = message ? `${title}\n\n${message}` : title;
            window.alert(fullMessage);
            
            // Simuler le callback du premier bouton s'il existe
            if (buttons && buttons.length > 0 && buttons[0].onPress) {
              try {
                buttons[0].onPress();
              } catch (callbackError) {
                console.log('⚠️ Button callback error:', callbackError);
              }
            }
          } else {
            // Fallback ultime : log dans la console
            console.log(`🚨 ALERT: ${title}${message ? ` - ${message}` : ''}`);
          }
        } catch (fallbackError) {
          console.log('❌ All alert fallbacks failed:', fallbackError);
        }
        resetState();
      }
    } else {
      // Sur mobile, utiliser Alert normalement
      try {
        Alert.alert(
          title,
          message,
          buttons || [{ text: 'OK', style: 'default', onPress: resetState }],
          { 
            cancelable: true,
            onDismiss: resetState
          }
        );
      } catch (mobileAlertError) {
        console.log(`❌ Mobile Alert failed:`, mobileAlertError);
        // Fallback : log dans la console
        console.log(`🚨 ALERT: ${title}${message ? ` - ${message}` : ''}`);
        resetState();
      }
    }
  }, [isShowing]);

  return { showAlert, isShowing };
};
