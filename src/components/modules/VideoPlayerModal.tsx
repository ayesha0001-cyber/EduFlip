import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  CheckCircle2,
  FileText,
  FileCheck2,
  BookOpen,
  Download,
  Clock,
  Sparkles,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import type { VideoLecture, LearningMaterial } from '../../types';
import { saveVideoProgress, getVideoProgress, markMaterialRead } from '../../services/dataService';
import { resolvePlayableUrl, getYouTubeEmbedInfo, getVimeoEmbedInfo } from '../../services/mediaStorage';
import { loadFileFromFirestore } from '../../services/firestoreStorage';

interface VideoPlayerModalProps {
  video: VideoLecture;
  materials: LearningMaterial[];
  onClose: () => void;
  onNavigateToQuiz: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  video,
  materials,
  onClose,
  onNavigateToQuiz
}) => {
  const { currentUser, selectedCourse, addToast } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [resolvedUrl, setResolvedUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.durationSec || 600);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [percent, setPercent] = useState(0);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'notes' | 'materials'>('transcript');

  // Resolve media URL on mount (handles IndexedDB local files, cloud URLs, or external links)
  useEffect(() => {
    let isMounted = true;
    resolvePlayableUrl(video.url).then((playable) => {
      if (isMounted) {
        setResolvedUrl(playable);
        setHasVideoError(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [video.url]);

  const ytInfo = getYouTubeEmbedInfo(resolvedUrl || video.url);
  const vimeoInfo = getVimeoEmbedInfo(resolvedUrl || video.url);
  const isEmbed = ytInfo.isYouTube || vimeoInfo.isVimeo;

  // Load prior progress on mount
  useEffect(() => {
    if (!currentUser) return;
    getVideoProgress(currentUser.userId, video.videoId).then((prog) => {
      if (prog) {
        setPercent(prog.percent);
        setIsCompleted(prog.completed);
        if (prog.lastPosition && prog.lastPosition < duration) {
          setCurrentTime(prog.lastPosition);
          if (videoRef.current) {
            videoRef.current.currentTime = prog.lastPosition;
          }
        }
      }
    });
  }, [currentUser?.userId, video.videoId, duration]);

  // Periodic progress saving & threshold check
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      if (videoRef.current && isPlaying) {
        const cur = videoRef.current.currentTime;
        const dur = videoRef.current.duration || duration;
        const currentPct = Math.min(100, Math.round((cur / dur) * 100));
        setCurrentTime(cur);
        setPercent(currentPct);

        const meetsThreshold = currentPct >= 90;
        if (meetsThreshold && !isCompleted) {
          setIsCompleted(true);
          addToast('🎉 Lecture watch completed (≥90%)! Readiness status updated.', 'success');
        }

        saveVideoProgress(
          currentUser.userId,
          video.videoId,
          selectedCourse?.courseId || 'course-swe301',
          Math.round(cur),
          currentPct,
          meetsThreshold
        );
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isPlaying, duration, isCompleted, currentUser?.userId, video.videoId, selectedCourse?.courseId, addToast]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {
          setIsPlaying(true);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    setCurrentTime(target);
    if (videoRef.current) {
      videoRef.current.currentTime = target;
    }
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const handleManualComplete = () => {
    setIsCompleted(true);
    setPercent(100);
    setCurrentTime(duration);
    if (currentUser) {
      saveVideoProgress(
        currentUser.userId,
        video.videoId,
        selectedCourse?.courseId || 'course-swe301',
        Math.round(duration),
        100,
        true
      );
    }
    addToast('🎉 Lecture marked as 100% completed! Pre-quiz unlocked.', 'success');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-[#1E3A5F] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Pre-Class Lecture
            </span>
            <h3 className="font-semibold text-xs sm:text-sm text-white truncate max-w-md sm:max-w-xl">
              {video.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Section */}
        <div className="relative bg-black aspect-video w-full flex items-center justify-center group overflow-hidden">
          {isEmbed ? (
            <div className="w-full h-full relative">
              <iframe
                src={ytInfo.embedUrl || vimeoInfo.embedUrl || ''}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
              <div className="absolute top-2 right-2 flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg text-[11px] text-white backdrop-blur-xs">
                <span>{ytInfo.isYouTube ? 'YouTube Stream' : 'Vimeo Stream'}</span>
                {!isCompleted && (
                  <button
                    onClick={handleManualComplete}
                    className="ml-1 px-2 py-0.5 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded text-[10px] font-bold"
                  >
                    Mark as Watched (100%)
                  </button>
                )}
              </div>
            </div>
          ) : hasVideoError ? (
            <div className="text-center p-6 text-white max-w-md space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <div className="font-semibold text-sm">Media Source Notice</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                The original media file could not be rendered directly. You can load the university open backup stream or download the file.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setResolvedUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
                    setHasVideoError(false);
                  }}
                  className="px-3 py-1.5 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-lg text-xs font-semibold"
                >
                  Play University Backup Stream
                </button>
                <button
                  onClick={handleManualComplete}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold"
                >
                  Mark as Completed
                </button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                src={resolvedUrl || video.url}
                poster={video.thumbnailUrl}
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
                onError={() => setHasVideoError(true)}
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    setCurrentTime(videoRef.current.currentTime);
                    setDuration(videoRef.current.duration || duration);
                  }
                }}
                onEnded={() => {
                  setIsPlaying(false);
                  setIsCompleted(true);
                  if (currentUser) {
                    saveVideoProgress(
                      currentUser.userId,
                      video.videoId,
                      selectedCourse?.courseId || 'course-swe301',
                      Math.round(duration),
                      100,
                      true
                    );
                  }
                  addToast('🎉 Lecture completed 100%! Ready for pre-class quiz.', 'success');
                }}
              />

              {/* Floating Big Play Button if paused */}
              {!isPlaying && (
                <button
                  onClick={togglePlay}
                  className="absolute w-16 h-16 rounded-full bg-[#0F766E]/90 text-white flex items-center justify-center shadow-lg hover:scale-105 transition"
                >
                  <Play className="w-8 h-8 ml-1 fill-white" />
                </button>
              )}

              {/* Bottom Player Overlay Controls */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 sm:p-4 text-white">
                {/* Seek Bar with Watch Indicator */}
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <button onClick={togglePlay} className="hover:text-teal-400">
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                    </button>
                    <span className="font-mono text-[11px] text-white/90">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                    <span className="text-[11px] text-teal-300 font-semibold hidden sm:inline">
                      Watched: {percent}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Speed selector */}
                    <div className="flex items-center bg-white/10 rounded-lg p-0.5 text-[11px]">
                      {[1, 1.25, 1.5, 2].map((s) => (
                        <button
                          key={s}
                          onClick={() => changeSpeed(s)}
                          className={`px-1.5 py-0.5 rounded ${playbackRate === s ? 'bg-[#0F766E] text-white font-bold' : 'text-white/70 hover:text-white'}`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.muted = !isMuted;
                          setIsMuted(!isMuted);
                        }
                      }}
                      className="hover:text-teal-400"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Completion Milestone Banner (appears when ≥90%) */}
        {isCompleted && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-3 px-5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Prerequisite video completed! You have unlocked the Pre-Class Readiness Quiz.</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onNavigateToQuiz();
              }}
              className="px-3 py-1.5 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-amber-300" />
              Start Pre-Class Quiz →
            </button>
          </div>
        )}

        {/* Bottom Details Tabs: Transcript, Notes, Materials */}
        <div className="p-4 bg-white flex-1 overflow-y-auto">
          <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 mb-3">
            <button
              onClick={() => setActiveTab('transcript')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'transcript' ? 'bg-[#D6F2EE] text-[#0F766E]' : 'text-[#5B6B7C] hover:bg-[#EEF3F7]'
              }`}
            >
              Transcript & Lecture Notes
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'materials' ? 'bg-[#D6F2EE] text-[#0F766E]' : 'text-[#5B6B7C] hover:bg-[#EEF3F7]'
              }`}
            >
              Attached Slides & Files ({materials.length})
            </button>
          </div>

          {activeTab === 'transcript' && (
            <div className="space-y-3 text-xs text-[#0F172A] leading-relaxed">
              <div className="p-3.5 rounded-xl bg-[#F7F9FB] border border-[#E2E8F0]">
                <div className="font-semibold text-[#1E3A5F] mb-1">Key Takeaways for Lab & Discussion:</div>
                <ul className="list-disc pl-4 space-y-1 text-[#5B6B7C]">
                  <li>Review core concepts before in-person interactive sessions.</li>
                  <li>Complete diagnostic self-checks to ensure readiness for collaborative group activities.</li>
                  <li>Bring questions to the physical sprint room for faculty guidance.</li>
                </ul>
              </div>
              <p className="text-[#5B6B7C]">
                {video.transcript || 'In this recorded session, the instructor covers fundamental principles and preparatory tasks for upcoming class exercises.'}
              </p>
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="space-y-2">
              {materials.length > 0 ? (
                materials.map((mat) => (
                  <div
                    key={mat.materialId}
                    className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F7F9FB] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0F766E] flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-[#0F172A]">{mat.title}</div>
                        <div className="text-[11px] text-[#5B6B7C]">{(mat.sizeBytes / 1024 / 1024).toFixed(1)} MB · {mat.type}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        addToast(`Preparing "${mat.title}"...`, 'info');
                        try {
                          const res = await loadFileFromFirestore(mat.url, mat.title);
                          const a = document.createElement('a');
                          a.href = res.objectUrl;
                          a.download = res.fileName || `${mat.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          if (currentUser && selectedCourse) {
                            markMaterialRead(currentUser.userId, mat.materialId, selectedCourse.courseId);
                          }
                          addToast(`Downloaded "${mat.title}"`, 'success');
                        } catch (err) {
                          console.error(err);
                          addToast(`Failed to open ${mat.title}`, 'error');
                        }
                      }}
                      className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-[#EEF3F7] rounded-lg text-xs font-semibold text-[#1E3A5F] flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#0F766E]" />
                      Download
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  No additional lecture handouts attached to this lesson.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
