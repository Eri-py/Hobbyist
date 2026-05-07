import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useState, useEffect } from "react";
import { useEventListener } from "expo";
import { SymbolView } from "expo-symbols";
import { useVideoPlayer, VideoView } from "expo-video";
import type { PlayingChangeEventPayload } from "expo-video";

type VideoPlayerProps = {
  uri: string;
  isActive?: boolean;
};

export function VideoPlayer({ uri, isActive = true }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });

  useEventListener(player, "playingChange", ({ isPlaying }: PlayingChangeEventPayload) => {
    setIsPlaying(isPlaying);
  });

  useEventListener(player, "playToEnd", () => {
    player.currentTime = 0;
  });

  useEffect(() => {
    if (!isActive && player.playing) {
      player.pause();
    }
  }, [isActive, player]);

  const handlePress = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <TouchableOpacity activeOpacity={1} onPress={handlePress} style={{ flex: 1 }}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
      />
      <View style={[StyleSheet.absoluteFill, styles.overlay]}>
        <View style={styles.playButton}>
          <SymbolView
            name={isPlaying ? "pause.fill" : "play.fill"}
            size={24}
            tintColor="white"
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
});
