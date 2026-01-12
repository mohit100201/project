import { Stack } from "expo-router";
import { theme } from "@/theme";

export default function ComplaintTicketsLayout() {
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
      <Stack.Screen name="index" options={{ title: "Complaints Tickets" }} />
     
      <Stack.Screen name="createTicket" options={{ title: "Create Ticket" }} />
    </Stack>
  );
}