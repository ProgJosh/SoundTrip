import React, { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Image,
  ImageStyle,
  Platform,
  Pressable,
  Text,
  View,
  ViewStyle,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { c, styles } from "./theme";
import { Track } from "../core/model";
import { useLibrary } from "../state/Library";
export type IconName = React.ComponentProps<typeof Ionicons>["name"];
export const Icon = ({
  name,
  size = 20,
  color = c.text,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) => <Ionicons name={name} size={size} color={color} />;
export function Button({
  children,
  onPress,
  icon,
  primary = false,
  disabled = false,
  compact = false,
  label,
  style,
}: {
  children?: React.ReactNode;
  onPress: () => void;
  icon?: IconName;
  primary?: boolean;
  disabled?: boolean;
  compact?: boolean;
  label?: string;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        label || (typeof children === "string" ? children : undefined)
      }
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 44,
          minWidth: 44,
          paddingHorizontal: compact ? 10 : 18,
          borderRadius: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          backgroundColor: primary ? c.accent : c.elevated,
          opacity: disabled ? 0.4 : pressed ? 0.65 : 1,
        },
        style,
      ]}
    >
      {icon && <Icon name={icon} color={primary ? c.bg : c.text} />}
      {children && (
        <Text
          style={{
            color: primary ? c.bg : c.text,
            fontWeight: "600",
            fontSize: 13,
          }}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}
export function Artwork({
  track,
  size = 56,
  style,
}: {
  track?: Track;
  size?: number;
  style?: ViewStyle;
}) {
  const { state } = useLibrary();
  const [failedArtwork, setFailedArtwork] = useState<string>();
  if (track?.artwork && failedArtwork !== track.artwork)
    return (
      <FadeIn key={track.id} reduce={state.settings.reducedMotion}>
        <Image
          accessibilityLabel={`${track.album} artwork`}
          source={{ uri: track.artwork }}
          onError={() => setFailedArtwork(track.artwork)}
          style={[
            { width: size, height: size, borderRadius: size > 100 ? 20 : 10 },
            style as ImageStyle,
          ]}
        />
      </FadeIn>
    );
  const colors: readonly [string, string] = track
    ? ([
        ["#bd794f", "#473b3b"],
        ["#649b9b", "#243b3e"],
        ["#92936c", "#343934"],
        ["#8c809d", "#38333e"],
      ][(track.title.charCodeAt(0) || 0) % 4]! as [string, string])
    : ["#94b8a1", "#354d49"];
  return (
    <FadeIn key={track?.id || "empty"} reduce={state.settings.reducedMotion}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size > 100 ? 20 : 10,
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
          },
          style,
        ]}
      >
        <View
          style={{
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: size,
            borderWidth: size * 0.12,
            borderColor: "#11191880",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: size * 0.15,
              height: size * 0.15,
              borderRadius: size,
              backgroundColor: "#f4ecd8b0",
            }}
          />
        </View>
        {size > 100 && (
          <Text
            style={{
              position: "absolute",
              bottom: 20,
              left: 22,
              color: "#ffffffcc",
              fontSize: 12,
              letterSpacing: 3,
            }}
          >
            SOUNDTRIP / LOCAL
          </Text>
        )}
      </LinearGradient>
    </FadeIn>
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: c.border,
        padding: 30,
        borderRadius: 16,
        alignItems: "center",
        gap: 12,
      }}
    >
      <Icon name="musical-notes-outline" size={28} color={c.teal} />
      <Text
        style={{
          color: c.text,
          fontSize: 18,
          fontWeight: "500",
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      <Text style={[styles.subtitle, { textAlign: "center", maxWidth: 400 }]}>
        {description}
      </Text>
      {action}
    </View>
  );
}
export function FadeIn({
  children,
  reduce = false,
}: {
  children: React.ReactNode;
  reduce?: boolean;
}) {
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((system) => {
      if (
        !alive ||
        reduce ||
        system ||
        (Platform.OS === "web" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      )
        return;
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });
    return () => {
      alive = false;
    };
  }, [opacity, reduce]);
  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}
