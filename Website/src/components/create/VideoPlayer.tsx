import { useState, useRef, useEffect } from "react";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import CloseIcon from "@mui/icons-material/Close";

import { OverlayIconButton } from "./OverlayIconButton";

type VideoPlayerProps = {
  src: string;
  onRemove?: () => void;
  showRemoveButton?: boolean;
};

export function VideoPlayer({ src, onRemove, showRemoveButton = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const hideControls = () => {
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    hideControls();
  };

  useEffect(() => {
    if (isPlaying) {
      hideControls();
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
    showControlsTemporarily();
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
    showControlsTemporarily();
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  return (
    <Box
      sx={{ position: "relative", width: "100%", height: "100%" }}
      onMouseMove={showControlsTemporarily}
      onTouchStart={showControlsTemporarily}
    >
      <video
        ref={videoRef}
        src={src}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        muted={isMuted}
        autoPlay
        playsInline
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onClick={togglePlayPause}
      />

      {/* Remove button */}
      {showRemoveButton && onRemove && (
        <OverlayIconButton
          onClick={handleRemove}
          size="large"
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            zIndex: 15,
          }}
        >
          <CloseIcon />
        </OverlayIconButton>
      )}

      {/* Play/Pause Button */}
      {showControls && (
        <OverlayIconButton
          onClick={togglePlayPause}
          size="large"
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10,
            padding: 1,
            transition: "opacity 0.3s ease",
            opacity: showControls ? 1 : 0,
          }}
        >
          {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        </OverlayIconButton>
      )}

      {/* Bottom Controls */}
      {showControls && (
        <Stack
          direction="row"
          alignItems="center"
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          padding={1}
          justifyContent="space-between"
          sx={{
            background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
            transition: "opacity 0.3s ease",
            opacity: showControls ? 1 : 0,
            zIndex: 10,
          }}
        >
          {/* Mute/Unmute Button */}
          <OverlayIconButton onClick={toggleMute} sx={{ padding: 1 }}>
            {isMuted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
          </OverlayIconButton>

          {/* Time Display */}
          <Typography color="white" fontFamily="monospace" fontSize={14}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Typography>
        </Stack>
      )}
    </Box>
  );
}
