import React from 'react';
import { Text, View } from 'react-native';
import { usePlayback } from '../src/state/Playback';
import { useLibrary } from '../src/state/Library';
import { move } from '../src/core/model';
import { Shell } from '../src/ui/Shell';
import { Button, Empty } from '../src/ui/kit';
import { TrackRow } from '../src/ui/LibraryScreen';
import { c, styles } from '../src/ui/theme';
export default function Queue() {
  const { state, update } = useLibrary(); const p = usePlayback();
  function reorder(from: number, to: number) { update(s => { const current = s.queue.ids[s.queue.index]; const ids = move(s.queue.ids, from, to); return { ...s, queue: { ...s.queue, ids, index: current ? ids.indexOf(current) : 0 } }; }); }
  return <Shell><View style={styles.section}><View style={[styles.row, { justifyContent: 'space-between' }]}><View><Text style={styles.title}>Along for the ride.</Text><Text style={styles.subtitle}>{state.queue.ids.length} tracks in your queue</Text></View><Button onPress={() => { p.seek(0); update(s => ({ ...s, queue: { ...s.queue, ids: [], index: 0, position: 0 } })); }}>Clear queue</Button></View>{state.queue.ids.map((key, i) => { const track = state.tracks.find(t => t.id === key); return track && <View key={`${key}-${i}`}><Text style={{ color: c.teal, fontSize: 11, paddingTop: 12 }}>{i === state.queue.index ? 'NOW PLAYING' : i < state.queue.index ? 'PLAYED' : 'UP NEXT'}</Text><TrackRow track={track} index={i} onPlay={() => { void p.play(state.queue.ids, i); }} /><View style={[styles.row, { justifyContent: 'flex-end' }]}><Button compact icon="arrow-up" label={`Move queue track ${i + 1} up`} disabled={i === 0} onPress={() => reorder(i, i - 1)} /><Button compact icon="arrow-down" label={`Move queue track ${i + 1} down`} disabled={i === state.queue.ids.length - 1} onPress={() => reorder(i, i + 1)} /><Button compact icon="remove" label={`Remove queue track ${i + 1}`} disabled={i === state.queue.index} onPress={() => update(s => ({ ...s, queue: { ...s.queue, ids: s.queue.ids.filter((_, n) => n !== i), index: i < s.queue.index ? s.queue.index - 1 : s.queue.index } }))} /></View></View>; })}{!state.queue.ids.length && <Empty title="An open road ahead" description="Play a playlist or shuffle your library to build your queue." />}</View></Shell>;
}
