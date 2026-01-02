import { Stack } from "expo-router";

export default function RechargeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "Mobile Recharge" }}
      />
    </Stack>
  );
}