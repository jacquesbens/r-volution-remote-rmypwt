
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

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
    console.log(`❓ Confirm requested: ${title} - ${message}`);
    
    if (isShowing) {
      console.log('⚠️ Confirm already showing, ignoring new request');
      return;
    }

    setIsShowing(true);

    // Fonction pour gérer l'annulation avec réinitialisation d'état
    const handleCancel = () => {
      console.log('❌ Confirm cancelled');
      try {
        onCancel?.();
      } catch (error) {
        console.log('⚠️ Cancel callback error:', error);
      }
      setTimeout(() => setIsShowing(false), 100);
    };

    // Fonction pour gérer la confirmation avec réinitialisation d'état
    const handleConfirm = () => {
      console.log('✅ Confirm accepted');
      try {
        onConfirm?.();
      } catch (error) {
        console.log('⚠️ Confirm callback error:', error);
      }
      setTimeout(() => setIsShowing(false), 100);
    };

    // Gestion spéciale pour l'environnement web/Preview
    if (typeof window !== 'undefined') {
      try {
        // Essayer d'abord Alert React Native
        Alert.alert(
          title,
          message,
          [
            { 
              text: cancelText, 
              style: 'cancel',
              onPress: handleCancel
            },
            { 
              text: confirmText, 
              style: 'default', 
              onPress: handleConfirm
            },
          ],
          { 
            cancelable: true,
            userInterfaceStyle: 'light',
            onDismiss: handleCancel
          }
        );
      } catch (alertError) {
        console.log(`⚠️ React Native Alert failed on web, using native confirm:`, alertError);
        // Fallback vers confirm natif du navigateur
        try {
          if (typeof window !== 'undefined' && window.confirm) {
            const fullMessage = message ? `${title}\n\n${message}` : title;
            const result = window.confirm(fullMessage);
            
            if (result) {
              handleConfirm();
            } else {
              handleCancel();
            }
          } else {
            // Fallback ultime : log dans la console et appeler onCancel
            console.log(`❓ CONFIRM: ${title}${message ? ` - ${message}` : ''} (auto-cancelled)`);
            handleCancel();
          }
        } catch (fallbackError) {
          console.log('❌ All confirm fallbacks failed:', fallbackError);
          handleCancel();
        }
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
              onPress: handleCancel
            },
            { 
              text: confirmText, 
              style: 'default', 
              onPress: handleConfirm
            },
          ],
          { 
            cancelable: true,
            onDismiss: handleCancel
          }
        );
      } catch (mobileAlertError) {
        console.log(`❌ Mobile Alert failed:`, mobileAlertError);
        // Fallback : log dans la console et appeler onCancel
        console.log(`❓ CONFIRM: ${title}${message ? ` - ${message}` : ''} (auto-cancelled)`);
        handleCancel();
      }
    }
  }, [isShowing]);

  return { showConfirm, isShowing };
};
