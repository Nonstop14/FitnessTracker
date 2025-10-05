import { Pressable, StyleSheet, Text, View } from "react-native";

interface WorkoutTimerProps {
  timeElapsed: number;
  isRunning: boolean;
  onToggleTimer: () => void;
}

export default function WorkoutTimer({ timeElapsed, isRunning, onToggleTimer }: WorkoutTimerProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.timerSection}>
      <Text style={styles.timerText}>{formatTime(timeElapsed)}</Text>
      <Pressable style={styles.timerButton} onPress={onToggleTimer}>
        <Text style={styles.timerButtonText}>
          {isRunning ? "Pause" : "Resume"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  timerSection: {
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: "#111827",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  timerText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#10b981",
    marginBottom: 8,
    fontFamily: "monospace",
  },
  timerButton: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  timerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
