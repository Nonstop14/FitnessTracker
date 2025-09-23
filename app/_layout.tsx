import { Stack } from "expo-router";
import { WorkoutsProvider } from "../context/WorkoutsContext";

export default function RootLayout() {
  return (
    <WorkoutsProvider>
      <Stack initialRouteName="(tabs)">
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="workouts/new"
          options={{
            title: "Add Workout",
            headerBackTitle: "Back",
            headerStyle: { backgroundColor: "#0f172a" },
            headerTitleStyle: { color: "#e2e8f0" },
            headerTintColor: "#e2e8f0",
          }}
        />
        <Stack.Screen
          name="workouts/[id]"
          options={{
            title: "Workout",
            headerBackTitle: "Back",
            headerStyle: { backgroundColor: "#0f172a" },
            headerTitleStyle: { color: "#e2e8f0" },
            headerTintColor: "#e2e8f0",
          }}
        />
        <Stack.Screen
          name="workouts/[id]/edit"
          options={{
            title: "Edit Workout",
            headerBackTitle: "Back",
            headerStyle: { backgroundColor: "#0f172a" },
            headerTitleStyle: { color: "#e2e8f0" },
            headerTintColor: "#e2e8f0",
          }}
        />
      </Stack>
    </WorkoutsProvider>
  );
}
