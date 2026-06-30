import { api, type TradeEntry } from "@/lib/api";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Check, ChevronLeft, Plus, SquarePen, Trash, X } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "tamagui";

type Result = "open" | "profit" | "loss" | "breakeven";

function computeLocalDecision(entries: TradeEntry[]): { ratio: number; decision: "TRADE" | "NO_TRADE" } {
  let profit = 0, loss = 0, breakeven = 0;
  for (const e of entries) {
    if (e.result === "profit") profit++;
    else if (e.result === "loss") loss++;
    else if (e.result === "breakeven") breakeven++;
  }
  const denominator = profit + loss + breakeven;
  if (denominator === 0) return { ratio: 0, decision: "TRADE" };
  const ratio = (profit + breakeven) / denominator;
  return { ratio, decision: ratio >= 0.5 ? "TRADE" : "NO_TRADE" };
}

function TradeCard({
  entry,
  editMode,
  onDelete,
  onTap,
}: {
  entry: TradeEntry;
  editMode: boolean;
  onDelete: () => void;
  onTap: () => void;
}) {
  const isTrade = entry.decision === "TRADE";
  const accentColor = isTrade ? "#276749" : "#9B2C2C";
  const pct = `${Math.round(Number(entry.successRatio) * 100)}%`;

  return (
    <TouchableOpacity
      style={[styles.card, isTrade ? styles.tradeCard : styles.noTradeCard]}
      onPress={editMode ? undefined : onTap}
      activeOpacity={editMode ? 1 : 0.8}
    >
      <View style={styles.cardLeft}>
        <Text style={[styles.cardDecision, { color: accentColor }]}>
          {isTrade ? "TRADE" : "NO TRADE"}
        </Text>
        <Text style={styles.cardR}>{entry.r}</Text>
      </View>
      <View style={styles.cardRight}>
        {isTrade ? <Check color={accentColor} size={18} /> : <X color={accentColor} size={18} />}
        <Text style={[styles.cardPct, { color: accentColor }]}>{pct}</Text>
        {editMode && (
          <TouchableOpacity onPress={onDelete} hitSlop={8} activeOpacity={0.7}>
            <Trash color="#E57373" size={18} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function SessionScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const [entries, setEntries] = useState<TradeEntry[]>([]);
  const [editMode, setEditMode] = useState(false);

  // Add trade sheet
  const [sheetVisible, setSheetVisible] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<{ ratio: number; decision: "TRADE" | "NO_TRADE" } | null>(null);

  // Edit dialog
  const [editingEntry, setEditingEntry] = useState<TradeEntry | null>(null);
  const [editResult, setEditResult] = useState<Result>("open");
  const [editR, setEditR] = useState("");

  useFocusEffect(
    useCallback(() => {
      api.sessions[":sessionId"]["trade-entries"].$get({ param: { sessionId: id } })
        .then((r) => r.json())
        .then((data) => {
          if ("tradeEntries" in data) setEntries(data.tradeEntries as TradeEntry[]);
        })
        .catch(() => {});
    }, [id]),
  );

  const openAddSheet = useCallback(() => {
    const dec = computeLocalDecision(entries);
    setPendingDecision(dec);
    setSheetVisible(true);
  }, [entries]);

  const saveNewTrade = useCallback(async () => {
    const res = await api.sessions[":sessionId"]["trade-entries"].$post({
      param: { sessionId: id },
      json: {},
    });
    const data = await res.json();
    if ("tradeEntry" in data) {
      setEntries((prev) => [...prev, data.tradeEntry as TradeEntry]);
    }
    setSheetVisible(false);
  }, [id]);

  const deleteEntry = useCallback((entryId: string) => {
    Alert.alert("Delete trade", "Delete this trade entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await api["trade-entries"][":id"].$delete({ param: { id: entryId } });
          setEntries((prev) => prev.filter((e) => e.id !== entryId));
        },
      },
    ]);
  }, []);

  const openEditDialog = useCallback((entry: TradeEntry) => {
    setEditingEntry(entry);
    setEditResult(entry.result);
    setEditR(entry.r);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingEntry) return;
    const res = await api["trade-entries"][":id"].$patch({
      param: { id: editingEntry.id },
      json: { result: editResult, r: editR.trim() || editingEntry.r },
    });
    const data = await res.json();
    if ("tradeEntry" in data) {
      setEntries((prev) =>
        prev.map((e) => (e.id === editingEntry.id ? (data.tradeEntry as TradeEntry) : e)),
      );
    }
    setEditingEntry(null);
  }, [editingEntry, editResult, editR]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {router.canGoBack() && (
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
              <ChevronLeft color="#fff" size={22} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setEditMode((v) => !v)} activeOpacity={0.7}>
            <SquarePen color={editMode ? BLUE : DARK_BLUE} size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{name}</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
            {entries.map((entry) => (
              <TradeCard
                key={entry.id}
                entry={entry}
                editMode={editMode}
                onDelete={() => deleteEntry(entry.id)}
                onTap={() => openEditDialog(entry)}
              />
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAddSheet} activeOpacity={0.8}>
        <Plus color="#fff" size={28} />
      </TouchableOpacity>

      {/* Add Trade Bottom Sheet */}
      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetVisible(false)}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setSheetVisible(false)} />
        <View style={styles.sheet}>
          {pendingDecision && (
            <DecisionStep
              decision={pendingDecision.decision}
              ratio={pendingDecision.ratio}
              onPress={saveNewTrade}
            />
          )}
        </View>
      </Modal>

      {/* Edit Dialog */}
      <Modal
        visible={editingEntry != null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingEntry(null)}
      >
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Edit Trade</Text>
            <ResultSegment value={editResult} onChange={setEditResult} />
            <Text style={styles.inputLabel}>R</Text>
            <TextInput
              style={styles.textInput}
              value={editR}
              onChangeText={setEditR}
              placeholder="e.g. 1/2"
              placeholderTextColor="#aaa"
            />
            <View style={styles.dialogButtons}>
              <TouchableOpacity style={styles.dialogCancel} onPress={() => setEditingEntry(null)} activeOpacity={0.8}>
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dialogSave} onPress={saveEdit} activeOpacity={0.8}>
                <Text style={styles.dialogSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DecisionStep({
  decision,
  ratio,
  onPress,
}: {
  decision: "TRADE" | "NO_TRADE";
  ratio: number;
  onPress: () => void;
}) {
  const isTrade = decision === "TRADE";
  const bg = isTrade ? "#C6F6D5" : "#FED7D7";
  const color = isTrade ? "#276749" : "#9B2C2C";
  const pct = `${Math.round(ratio * 100)}%`;

  return (
    <View style={styles.decisionStep}>
      <TouchableOpacity style={[styles.decisionCard, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.85}>
        <View style={styles.decisionCardLeft}>
          {isTrade ? <Check color={color} size={22} /> : <X color={color} size={22} />}
          <Text style={[styles.decisionLabel, { color }]}>{isTrade ? "TRADE" : "NO TRADE"}</Text>
        </View>
        <Text style={[styles.decisionPct, { color }]}>{pct}</Text>
      </TouchableOpacity>
      <Text style={styles.decisionHint}>Tap to add</Text>
    </View>
  );
}

const RESULTS: { value: Result; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "profit", label: "Profit" },
  { value: "loss", label: "Loss" },
  { value: "breakeven", label: "BE" },
];

function ResultSegment({ value, onChange }: { value: Result; onChange: (v: Result) => void }) {
  return (
    <View style={styles.segment}>
      {RESULTS.map((r) => (
        <TouchableOpacity
          key={r.value}
          style={[styles.segmentBtn, value === r.value && styles.segmentBtnActive]}
          onPress={() => onChange(r.value)}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, value === r.value && styles.segmentTextActive]}>
            {r.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const BLUE = "#6FA8DC";
const DARK_BLUE = "#1A3A5C";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  title: { fontSize: 22, fontWeight: "700", color: DARK_BLUE, marginBottom: 16 },
  listContent: { gap: 10, paddingBottom: 96 },

  // Trade card
  card: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tradeCard: { backgroundColor: "#C6F6D5" },
  noTradeCard: { backgroundColor: "#FED7D7" },
  cardLeft: { gap: 2 },
  cardDecision: { fontSize: 16, fontWeight: "700" },
  cardR: { fontSize: 13, color: "#555" },
  cardRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardPct: { fontSize: 16, fontWeight: "700" },

  // FAB
  fab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },

  // Bottom sheet
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // Decision step
  decisionStep: { gap: 12 },
  decisionCard: { borderRadius: 16, paddingHorizontal: 20, paddingVertical: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  decisionCardLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  decisionLabel: { fontSize: 22, fontWeight: "800" },
  decisionPct: { fontSize: 28, fontWeight: "800" },
  decisionHint: { textAlign: "center", color: "#aaa", fontSize: 13 },

  // Shared inputs
  inputLabel: { fontSize: 13, fontWeight: "600", color: DARK_BLUE },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: DARK_BLUE,
  },

  // Segmented control
  segment: { flexDirection: "row", borderRadius: 10, borderWidth: 1, borderColor: "#ddd", overflow: "hidden" },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: "center", backgroundColor: "#fff" },
  segmentBtnActive: { backgroundColor: DARK_BLUE },
  segmentText: { fontSize: 13, fontWeight: "600", color: "#888" },
  segmentTextActive: { color: "#fff" },

  // Dialog
  dialogBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", paddingHorizontal: 24 },
  dialog: { backgroundColor: "#fff", borderRadius: 20, padding: 24, gap: 14 },
  dialogTitle: { fontSize: 18, fontWeight: "700", color: DARK_BLUE },
  dialogButtons: { flexDirection: "row", gap: 10, marginTop: 4 },
  dialogCancel: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: "#ddd", alignItems: "center" },
  dialogCancelText: { color: "#555", fontWeight: "600" },
  dialogSave: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: DARK_BLUE, alignItems: "center" },
  dialogSaveText: { color: "#fff", fontWeight: "600" },
});
