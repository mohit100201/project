import { Stack } from "expo-router";

export default function PlansAndSubsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "Plans And Subscriptions" }}
      />
    </Stack>
  );
}