
import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';

export const useNativeConfirm = () => {
  const [isShowing, setIsShowing] = useState(false);

  const showConfirm = useCallback((
    title: string, 
    message?: string, 
    onConfirm?: () => void, 
    onCancel?: () => void,
    confirmText: string = 'OK',
    cancelText: string = 'Annuler'
  ) => {
    console.log(`❓ Confirm requested: ${title} - ${message} (Platform: ${Platform.OS})`);
    
    if (isShowing) {
      console.log('⚠️ Confirm already showing, ignoring new request');
      return;
    }

    setIsShowing(true);

    // Gestion spéciale pour l'environnement web/Preview
    if (Platform.OS === 'web') {
      try {
        // Essayer d'abord Alert React Native
        Alert.alert(
          title,
          message,
          [
            { 
              text: cancelText, 
              style: 'cancel',
              onPress: () => {
                console.log('❌ Confirm cancelled via Alert');
                onCancel?.();
                setIsShowing(false);
              }
            },
            { 
              text: confirmText, 
              style: 'default', 
              onPress: () => {
                console.log('✅ Confirm accepted via Alert');
                onConfirm?.();
                setIsShowing(false);
              }
            },
          ],
          { 
            cancelable: true,
            userInterfaceStyle: 'light',
            onDismiss: () => {
              console.log('❌ Confirm dismissed');
              onCancel?.();
              setIsShowing(false);
            }
          }
        );
      } catch (alertError) {
        console.log(`⚠️ React Native Alert failed on web, using native confirm:`, alertError);
        // Fallback vers confirm natif du navigateur
        if (typeof window !== 'undefined' && window.confirm) {
          const fullMessage = message ? `${title}\n\n${message}` : title;
          const result = window.confirm(fullMessage);
          
          if (result) {
            console.log('✅ Confirm accepted via native confirm');
            onConfirm?.();
          } else {
            console.log('❌ Confirm cancelled via native confirm');
            onCancel?.();
          }
        } else {
          // Fallback ultime : log dans la console et appeler onCancel
          console.log(`❓ CONFIRM: ${title}${message ? ` - ${message}` : ''} (auto-cancelled)`);
          onCancel?.();
        }
        setIsShowing(false);
      }
    } else {
      // Sur mobile, utiliser Alert normalement
      try {
        Alert.alert(
          title,
          message,
          [
            { 
              text: cancelText, 
              style: 'cancel',
              onPress: () => {
                console.log('❌ Confirm cancelled');
                onCancel?.();
                setIsShowing(false);
              }
            },
            { 
              text: confirmText, 
              style: 'default', 
              onPress: () => {
                console.log('✅ Confirm accepted');
                onConfirm?.();
                setIsShowing(false);
              }
            },
          ],
          { 
            cancelable: true,
            onDismiss: () => {
              console.log('❌ Confirm dismissed');
              onCancel?.();
              setIsShowing(false);
            }
          }
        );
      } catch (mobileAlertError) {
        console.log(`❌ Mobile Alert failed:`, mobileAlertError);
        // Fallback : log dans la console et appeler onCancel
        console.log(`❓ CONFIRM: ${title}${message ? ` - ${message}` : ''} (auto-cancelled)`);
        onCancel?.();
        setIsShowing(false);
      }
    }
  }, [isShowing]);

  return { showConfirm, isShowing };
};
