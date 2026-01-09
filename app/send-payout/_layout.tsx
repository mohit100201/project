import { Stack } from "expo-router";
import { theme } from "@/theme";

export default function SendPayoutLayout() {
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: theme.colors.background.light },
        headerTitleStyle: { 
          color: theme.colors.text.primary,
          fontSize: 18,
          fontWeight: '700' 
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Move to Bank" }} />
     
      <Stack.Screen name="RequestPayout" options={{ title: "Payout" }} />
    </Stack>
  );
}