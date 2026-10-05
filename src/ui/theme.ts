import { StyleSheet } from 'react-native';
export const c = { bg: '#101313', panel: '#181c1b', elevated: '#222827', border: '#303735', text: '#f1f2e9', muted: '#a3b0a8', accent: '#d7f79a', teal: '#83c5b6', orange: '#e8ae82' };
export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  title: { color: c.text, fontSize: 34, fontWeight: '600', letterSpacing: -1.4 },
  subtitle: { color: c.muted, fontSize: 14, lineHeight: 22 },
  label: { color: c.muted, fontSize: 11, fontWeight: '600', letterSpacing: 1.8, textTransform: 'uppercase' },
  section: { gap: 18, marginBottom: 34 },
  card: { backgroundColor: c.panel, borderWidth: 1, borderColor: c.border, borderRadius: 18, padding: 22, gap: 12 },
  input: { backgroundColor: c.bg, borderColor: c.border, borderWidth: 1, borderRadius: 10, padding: 14, color: c.text, fontSize: 15, minHeight: 48 },
});
