/**
 * Finalidade: raiz do app mobile (placeholder Sprint 0).
 * Como funciona: tela mínima; as telas da seção 7 entram a partir do Sprint 3, com
 *   câmera/GPS/voz e modo offline nos sprints correspondentes.
 * Relações: registrado por index.ts (Expo).
 */
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Rota33</Text>
      <Text style={styles.sub}>Setup concluído (Sprint 0).</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  titulo: { fontSize: 24, fontWeight: "600" },
  sub: { color: "#6b7280", marginTop: 8 },
});
