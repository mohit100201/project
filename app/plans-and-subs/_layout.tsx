import { Stack } from "expo-router";

export default function DMTLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "Plans And Subscriptions" }}
      />
    </Stack>
  );
}