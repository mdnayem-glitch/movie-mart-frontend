"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  RotateCcw, RotateCw, Loader2, PictureInPicture, Lock, AlertCircle
} from "lucide-react";

// Check if it's a Cloudflare Stream URL
const isCloudflareStream = (url) => {
  return url?.includes('cloudflarestream.com') || url?.includes('videodelivery.net');
};

// Extract video UID from Cloudflare URL
const extractCloudflareUid = (url) => {
  if (!url) return null;
  const match = url.match(/([a-f0-9]{32})/i);
  return match ? match[1] : null;
};

const SecureVideoPlayer = ({ 
  videoId,
  userId,
  posterUrl, 
  title,
  onProgress,
  initialProgress = 0,
  canWatch = false,
  isFree = false,
  onUnauthorized,
  onPurchaseRequired,
  episodeStreamUrl = null,
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  const hideControlsTimeout = useRef(null);
  
  const [streamData, setStreamData] = useState(null);
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

  // Format time to MM:SS or HH:MM:SS
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Reset stream state when the source changes
  useEffect(() => {
    setStreamData(null);
    setStreamError(null);
    setIsLoadingStream(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHasStartedPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
    // If an episode URL is passed directly, inject it as stream data immediately
    if (episodeStreamUrl) {
      setStreamData({ streamUrl: episodeStreamUrl });
    }
  }, [videoId, episodeStreamUrl]);

  // Fetch secure stream URL
  const fetchSecureStream = useCallback(async () => {
    if (!videoId) return;
    // Episode URL is already injected via effect — no need to fetch
    if (episodeStreamUrl) return;
    
    setIsLoadingStream(true);
    setStreamError(null);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.moviemart.org/v1/api";
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      
      const response = await fetch(`${API_URL}/watch-videos/${videoId}/stream?${params.toString()}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setStreamData(result.data);
      } else {
        if (result.data?.requiresPurchase) {
          onPurchaseRequired?.();
        }
        setStreamError(result.message || 'Failed to load video stream');
      }
    } catch (error) {
      console.error('Stream fetch error:', error);
      setStreamError('Failed to load video. Please try again.');
    } finally {
      setIsLoadingStream(false);
    }
  }, [videoId, userId, onPurchaseRequired, episodeStreamUrl]);

  // Fetch stream when user tries to play
  const handlePlayAttempt = useCallback(() => {
    if (!canWatch && !isFree) {
      onPurchaseRequired?.();
      return;
    }
    
    if (!streamData && !isLoadingStream) {
      fetchSecureStream();
    }
  }, [canWatch, isFree, streamData, isLoadingStream, fetchSecureStream, onPurchaseRequired]);

  // SECURITY: Disable right-click context menu
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    const preventKeyboardShortcuts = (e) => {
      // Prevent Ctrl+S, Ctrl+Shift+I, F12
      if (
        (e.ctrlKey && e.key === 's') ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        return false;
      }
    };

    container.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventKeyboardShortcuts);

    return () => {
      container.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventKeyboardShortcuts);
    };
  }, []);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
      if (initialProgress > 0) {
        video.currentTime = (initialProgress / 100) * video.duration;
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (onProgress && video.duration) {
        onProgress({
          watchedDuration: video.currentTime,
          totalDuration: video.duration,
          progress: (video.currentTime / video.duration) * 100
        });
      }
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
      }
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
    };
  }, [initialProgress, onProgress, streamData]);

  // Hide controls after inactivity
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
      if (isPlaying) {
        hideControlsTimeout.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };

    const container = containerRef.current;
    container?.addEventListener('mousemove', handleMouseMove);

    return () => {
      container?.removeEventListener('mousemove', handleMouseMove);
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, [isPlaying]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!streamData) {
      handlePlayAttempt();
      return;
    }
    
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
      setHasStartedPlaying(true);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, streamData, handlePlayAttempt]);

  // Toggle mute
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Skip forward/backward
  const skip = (seconds) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  // Handle progress bar click
  const handleProgressClick = (e) => {
    if (!streamData) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    if (videoRef.current) {
      videoRef.current.currentTime = pos * duration;
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  // Change playback rate
  const changePlaybackRate = (rate) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
    setShowSettings(false);
  };

  // Picture in Picture
  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  // Check if this is a Cloudflare Stream video
  const cloudflareUid = streamData?.cloudflareVideoUid || extractCloudflareUid(streamData?.streamUrl);
  const useCloudflarePlayer = isCloudflareStream(streamData?.streamUrl) && cloudflareUid;

  // Show loading state while fetching stream
  if (isLoadingStream) {
    return (
      <div 
        ref={containerRef}
        className="relative w-full aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center"
        onContextMenu={(e) => e.preventDefault()}
      >
        <img
          src={posterUrl}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover filter blur-sm opacity-50"
        />
        <div className="relative z-10 flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-pink-500 animate-spin mb-4" />
          <p className="text-white text-sm">Loading secure stream...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (streamError) {
    return (
      <div 
        ref={containerRef}
        className="relative w-full aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center"
        onContextMenu={(e) => e.preventDefault()}
      >
        <img
          src={posterUrl}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover filter blur-sm opacity-50"
        />
        <div className="relative z-10 flex flex-col items-center text-center px-4">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-white font-medium mb-2">{streamError}</p>
          <button
            onClick={fetchSecureStream}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show play prompt when no stream data yet
  if (!streamData && !hasStartedPlaying) {
    return (
      <div 
        ref={containerRef}
        className="relative w-full aspect-video bg-black rounded-xl overflow-hidden cursor-pointer group"
        onClick={handlePlayAttempt}
        onContextMenu={(e) => e.preventDefault()}
      >
        <img
          src={posterUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition">
          <div className="bg-white/20 backdrop-blur-md p-6 rounded-full hover:scale-110 transition-transform">
            <Play className="w-12 h-12 text-white fill-white" />
          </div>
        </div>
        {title && (
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
            <h2 className="text-white text-lg font-medium truncate">{title}</h2>
          </div>
        )}
        {/* Security badge */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full">
          <Lock className="w-3 h-3 text-green-400" />
          <span className="text-xs text-green-400">Secure Stream</span>
        </div>
      </div>
    );
  }

  // Cloudflare Stream Player (iframe) - inherently more secure
  if (useCloudflarePlayer) {
    const customerMatch = streamData?.streamUrl?.match(/customer-([a-z0-9]+)\./i);
    const customerCode = customerMatch ? customerMatch[1] : '';
    
    const iframeSrc = customerCode 
      ? `https://customer-${customerCode}.cloudflarestream.com/${cloudflareUid}/iframe?poster=${encodeURIComponent(posterUrl || '')}&primaryColor=ec4899&letterboxColor=000000&controls=true`
      : `https://iframe.videodelivery.net/${cloudflareUid}?poster=${encodeURIComponent(posterUrl || '')}&primaryColor=ec4899`;

    return (
      <div 
        ref={containerRef}
        className={`relative w-full bg-black rounded-xl overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : 'aspect-video'}`}
        onContextMenu={(e) => e.preventDefault()}
        style={{ userSelect: 'none' }}
      >
        <iframe
          src={iframeSrc}
          style={{ border: 'none', width: '100%', height: '100%', pointerEvents: 'auto' }}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen={true}
          title={title || 'Secure Video Player'}
        />
        
        {/* Security overlay to prevent inspection */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-lg font-medium truncate">{title}</h2>
            <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded">
              <Lock className="w-3 h-3 text-green-400" />
              <span className="text-xs text-green-400">Protected</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular HTML5 Video Player with security measures
  return (
    <div 
      ref={containerRef}
      className={`relative w-full bg-black rounded-xl overflow-hidden group ${isFullscreen ? 'fixed inset-0 z-50' : 'aspect-video'}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onContextMenu={(e) => e.preventDefault()}
      style={{ userSelect: 'none' }}
    >
      {/* Video Element - crossOrigin helps prevent direct download */}
      <video
        ref={videoRef}
        src={streamData?.streamUrl}
        poster={posterUrl}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        playsInline
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture={false}
        onContextMenu={(e) => e.preventDefault()}
        style={{ pointerEvents: 'auto' }}
      />

      {/* Transparent overlay to prevent video element inspection */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ background: 'transparent' }}
      />

      {/* Loading Spinner */}
      {isLoading && streamData && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {/* Play/Pause Overlay */}
      {!isPlaying && !isLoading && streamData && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="bg-white/20 backdrop-blur-md p-6 rounded-full hover:scale-110 transition-transform">
            <Play className="w-12 h-12 text-white fill-white" />
          </div>
        </div>
      )}

      {/* Controls Container */}
      {streamData && (
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 ${
            showControls || !isPlaying || isHovering ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress Bar */}
          <div 
            ref={progressRef}
            className="w-full h-1 bg-gray-600 cursor-pointer group/progress mx-4 mb-2"
            style={{ width: 'calc(100% - 2rem)' }}
            onClick={handleProgressClick}
          >
            <div className="absolute h-1 bg-gray-500" style={{ width: `${buffered}%` }} />
            <div 
              className="absolute h-1 bg-gradient-to-r from-pink-500 to-red-500 group-hover/progress:h-1.5 transition-all"
              style={{ width: `${progress}%` }}
            />
            <div 
              className="absolute w-3 h-3 bg-white rounded-full -top-1 opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between px-4 pb-4">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="text-white hover:text-pink-400 transition-colors">
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-white" />}
              </button>
              <button onClick={() => skip(-10)} className="text-white hover:text-pink-400 transition-colors">
                <RotateCcw className="w-5 h-5" />
              </button>
              <button onClick={() => skip(10)} className="text-white hover:text-pink-400 transition-colors">
                <RotateCw className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 group/volume">
                <button onClick={toggleMute} className="text-white hover:text-pink-400 transition-colors">
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-0 group-hover/volume:w-20 transition-all duration-300 accent-pink-500"
                />
              </div>
              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Security indicator */}
              <div className="flex items-center gap-1 text-green-400 text-xs">
                <Lock className="w-3 h-3" />
                <span className="hidden sm:inline">Protected</span>
              </div>
              
              {/* Playback Speed */}
              <div className="relative">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-white hover:text-pink-400 transition-colors text-sm"
                >
                  {playbackRate}x
                </button>
                {showSettings && (
                  <div className="absolute bottom-8 right-0 bg-gray-900 rounded-lg p-2 shadow-lg">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={`block w-full px-4 py-1 text-sm text-left hover:bg-gray-700 rounded ${
                          playbackRate === rate ? 'text-pink-400' : 'text-white'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={togglePiP} className="text-white hover:text-pink-400 transition-colors hidden sm:block">
                <PictureInPicture className="w-5 h-5" />
              </button>
              <button onClick={toggleFullscreen} className="text-white hover:text-pink-400 transition-colors">
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Title Overlay */}
      {title && (showControls || !isPlaying) && (
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-lg font-medium truncate">{title}</h2>
            <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded">
              <Lock className="w-3 h-3 text-green-400" />
              <span className="text-xs text-green-400">Secure</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecureVideoPlayer;
