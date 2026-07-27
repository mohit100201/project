import messaging from '@react-native-firebase/messaging';
import Toast from 'react-native-toast-message';


export const initNotifications = async () => {
  try {
    // Ask permission
    const authStatus = await messaging().requestPermission();

    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log("❌ Permission denied");
      return null;
    }

    // Get token
    const token = await messaging().getToken();
    console.log("🔥 FCM TOKEN:", token);

    return token;
  } catch (error) {
    console.log("❌ Error in initNotifications:", error);
    return null;
  }
};

export const listenNotifications = () => {
  return messaging().onMessage(async remoteMessage => {
    
    // ✅ 1. Log full payload
    console.log("🔥 Notification Received:", remoteMessage);

    const title = remoteMessage.notification?.title || "New Notification";
    const body = remoteMessage.notification?.body || "";

    // ✅ 2. Show toast
    Toast.show({
      type: "success", // or "error" / "info"
      text1: title,
      text2: body,
    });
  });
};