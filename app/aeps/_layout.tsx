import { Stack } from "expo-router";

export default function AEPSLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "AEPS" }}
      />
    </Stack>
  );
}
