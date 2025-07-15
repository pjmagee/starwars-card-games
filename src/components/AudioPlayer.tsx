import React, { useState, useRef, useEffect } from 'react';
import { Button, Text } from '@fluentui/react-components';
import { Speaker2Regular, SpeakerMuteRegular, PlayRegular, PauseRegular } from '@fluentui/react-icons';
import './AudioPlayer.css';

interface AudioPlayerProps {
  title?: string;
  autoPlay?: boolean;
  loop?: boolean;
  volume?: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  title = "Card Game Music",
  autoPlay = true,
  loop = true,
  volume = 0.2
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false); // Start with false since auto-play might fail
  const [isMuted, setIsMuted] = useState(false);
  const [currentVolume] = useState(volume);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Public folder assets are served from the root URL
  const audioSrc = '/card_background_music.mp3';

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = currentVolume;
    audio.loop = loop;

    const handleLoadedData = () => {
      console.log('Audio loaded successfully');
      setHasError(false);
      setIsLoaded(true);
      
      // Try auto-play, but don't rely on it working
      if (autoPlay) {
        audio.play().catch((error) => {
          console.warn('Audio auto-play failed (this is normal):', error.message);
          setIsPlaying(false);
        });
      }
    };

    const handleError = (event: Event) => {
      const target = event.target as HTMLAudioElement;
      console.error('Audio error:', target?.error);
      console.error('Audio source:', audioSrc);
      setHasError(true);
      setIsPlaying(false);
      setIsLoaded(false);
    };

    const handlePlay = () => {
      console.log('Audio started playing');
      setIsPlaying(true);
    };
    
    const handlePause = () => {
      console.log('Audio paused');
      setIsPlaying(false);
    };
    
    const handleEnded = () => {
      console.log('Audio ended');
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      console.log('Audio can start playing');
      setIsLoaded(true);
    };

    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [autoPlay, loop, currentVolume]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || hasError) return;

    if (isPlaying) {
      audio.pause();
    } else {
      // User interaction allows us to play audio
      audio.play().catch((error) => {
        console.error('Failed to play audio:', error);
        setHasError(true);
      });
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio || hasError) return;

    if (isMuted) {
      audio.volume = currentVolume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={audioSrc} preload="auto" />
      
      <Button
        appearance="subtle"
        icon={isPlaying ? <PauseRegular /> : <PlayRegular />}
        onClick={togglePlayPause}
        title={isPlaying ? 'Pause' : 'Play'}
        disabled={hasError}
      />
      
      <Button
        appearance="subtle"
        icon={isMuted ? <SpeakerMuteRegular /> : <Speaker2Regular />}
        onClick={toggleMute}
        title={isMuted ? 'Unmute' : 'Mute'}
        disabled={hasError}
      />
      
      <Text size={200} className="audio-player-text">
        {hasError ? 'Audio file not found' : 
         !isLoaded ? 'Loading audio...' :
         isPlaying ? title : `${title} (Click to play)`}
      </Text>
    </div>
  );
};
