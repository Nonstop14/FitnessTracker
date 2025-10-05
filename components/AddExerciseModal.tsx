import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

interface AddExerciseModalProps {
  visible: boolean;
  exerciseName: string;
  exerciseSets: string;
  onExerciseNameChange: (name: string) => void;
  onExerciseSetsChange: (sets: string) => void;
  onClose: () => void;
  onAdd: () => void;
}

export default function AddExerciseModal({
  visible,
  exerciseName,
  exerciseSets,
  onExerciseNameChange,
  onExerciseSetsChange,
  onClose,
  onAdd,
}: AddExerciseModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.addExerciseModal} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>Add New Exercise</Text>
          
          <View style={styles.modalInputGroup}>
            <Text style={styles.modalLabel}>Exercise Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., Bench Press"
              value={exerciseName}
              onChangeText={onExerciseNameChange}
              autoFocus={true}
            />
          </View>
          
          <View style={styles.modalInputGroup}>
            <Text style={styles.modalLabel}>Number of Sets</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., 4"
              value={exerciseSets}
              onChangeText={onExerciseSetsChange}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
          
          <View style={styles.modalButtons}>
            <Pressable 
              style={styles.modalCancelButton}
              onPress={onClose}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </Pressable>
            
            <Pressable 
              style={styles.modalAddButton}
              onPress={onAdd}
            >
              <Text style={styles.modalAddButtonText}>Add Exercise</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  addExerciseModal: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    minWidth: 320,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#e5e7eb",
    textAlign: "center",
    marginBottom: 24,
  },
  modalInputGroup: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#cbd5e1",
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: "#1f2937",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#e5e7eb",
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#374151",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancelButtonText: {
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "600",
  },
  modalAddButton: {
    flex: 1,
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  modalAddButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
