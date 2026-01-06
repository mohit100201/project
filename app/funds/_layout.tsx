import { Stack } from "expo-router";
import { theme } from "@/theme";

export default function FundsLayout() {
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
      <Stack.Screen name="index" options={{ title: "Bank Deposit" }} />
     
      <Stack.Screen name="RequestFunds" options={{ title: "Add Funds" }} />
    </Stack>
  );
}