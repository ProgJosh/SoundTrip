import React from "react";
import { View } from "react-native";
import type NativeSlider from "@react-native-community/slider";

// A real range input supplies keyboard controls and accurate screen-reader values.
export default function Slider(
  props: React.ComponentProps<typeof NativeSlider>,
) {
  const min = props.minimumValue ?? 0;
  const max = props.maximumValue ?? 1;
  return (
    <View style={[{ justifyContent: "center", minHeight: 44 }, props.style]}>
      <input
        type="range"
        aria-label={props.accessibilityLabel}
        aria-valuetext={props.accessibilityValue?.text}
        min={min}
        max={max}
        step={props.step || "any"}
        value={Math.max(min, Math.min(max, props.value ?? min))}
        disabled={props.disabled}
        onChange={(event) => {
          const value = event.currentTarget.valueAsNumber;
          props.onValueChange?.(value);
          props.onSlidingComplete?.(value);
        }}
        style={{
          width: "100%",
          minWidth: 0,
          height: 40,
          margin: 0,
          accentColor: String(props.minimumTrackTintColor || "#d1deab"),
          cursor: "pointer",
        }}
      />
    </View>
  );
}
