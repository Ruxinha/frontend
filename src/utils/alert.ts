import { Alert, Platform } from 'react-native';

export const webAlert = (
  title: string,
  message?: string,
  buttons?: any[]
) => {
  if (Platform.OS === 'web' && buttons && buttons.length > 0) {
    const confirmText = message ? `${title}\n\n${message}` : title;
    
    // Check if it's a simple confirm vs action sheet
    if (buttons.length <= 2 || buttons.some(b => b.style === 'cancel' || b.style === 'destructive')) {
      const isConfirmed = window.confirm(confirmText);
      if (isConfirmed) {
        const confirmBtn = buttons.find(b => b.style === 'destructive' || b.style === 'default' || (b.text && b.text.toLowerCase() !== 'cancel'));
        if (confirmBtn && confirmBtn.onPress) confirmBtn.onPress();
      } else {
        const cancelBtn = buttons.find(b => b.style === 'cancel' || (b.text && b.text.toLowerCase() === 'cancel'));
        if (cancelBtn && cancelBtn.onPress) cancelBtn.onPress();
      }
      return;
    } else {
      // It's a prompt wrapper for many buttons (like Invoice status)
      const options = buttons.filter(b => b.style !== 'cancel').map(b => b.text).join(', ');
      const userChoice = window.prompt(`${confirmText}\nOptions: ${options}`);
      if (userChoice) {
        const chosenBtn = buttons.find(b => b.text?.toLowerCase() === userChoice.toLowerCase());
        if (chosenBtn && chosenBtn.onPress) chosenBtn.onPress();
      }
      return;
    }
  }
  
  Alert.alert(title, message, buttons);
};
