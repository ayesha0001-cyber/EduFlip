import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Video,
  FileText,
  PlayCircle,
  CheckCircle2,
  Clock,
  Plus,
  ChevronDown,
  ChevronUp,
  Download,
  BookOpen,
  Calendar,
  Sparkles,
  ExternalLink,
  Upload,
  Trash2,
  Code,
  Presentation,
  Link as LinkIcon,
  X,
  FileCheck,
  Paperclip,
  Check,
  AlertCircle
} from 'lucide-react';
import type { Module, Lesson, VideoLecture, LearningMaterial } from '../../types';
import {
  getModules,
  getLessons,
  getVideoLectures,
  getMaterials,
  createModule,
  createLesson,
  addVideoLecture,
  updateVideoLecture,
  addMaterial,
  deleteMaterial,
  deleteVideoLecture,
  markMaterialRead,
  subscribeToVideoLectures,
  subscribeToLearningMaterials,
  subscribeToModules
} from '../../services/dataService';
import { saveMediaFile, SAMPLE_LECTURE_PRESETS, RELIABLE_BACKUP_VIDEO_STREAM } from '../../services/mediaStorage';
import { saveFileToFirestore } from '../../services/firestoreStorage';
import { VideoPlayerModal } from './VideoPlayerModal';
import { MaterialViewerModal } from './MaterialViewerModal';

interface CourseModulesViewProps {
  onNavigateToQuiz: () => void;
}

// Helper: generate video thumbnail frame
function captureVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    const fallback = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80';
    try {
      const url = URL.createObjectURL(file);
      const vid = document.createElement('video');
      vid.preload = 'metadata';
      vid.muted = true;
      vid.playsInline = true;

      const timeout = setTimeout(() => {
        URL.revokeObjectURL(url);
        resolve(fallback);
      }, 2500);

      vid.onloadedmetadata = () => {
        vid.currentTime = Math.min(2, Math.max(0.5, (vid.duration || 2) / 2));
      };

      vid.onseeked = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 480;
          canvas.height = 270;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(vid, 0, 0, 480, 270);
            const thumb = canvas.toDataURL('image/jpeg', 0.65);
            URL.revokeObjectURL(url);
            resolve(thumb);
            return;
          }
        } catch {
          // ignore
        }
        URL.revokeObjectURL(url);
        resolve(fallback);
      };

      vid.onerror = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        resolve(fallback);
      };

      vid.src = url;
    } catch {
      resolve(fallback);
    }
  });
}

export const CourseModulesView: React.FC<CourseModulesViewProps> = ({ onNavigateToQuiz }) => {
  const { selectedCourse, role, currentUser, addToast, openCreateCourseModal } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [lessonsMap, setLessonsMap] = useState<Record<string, Lesson[]>>({});
  const [videos, setVideos] = useState<VideoLecture[]>([]);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({ 'mod-1': true });

  const [activeVideo, setActiveVideo] = useState<VideoLecture | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<LearningMaterial | null>(null);

  // Teacher Modals
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDesc, setNewModuleDesc] = useState('');

  const [showAddLessonModal, setShowAddLessonModal] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonContent, setNewLessonContent] = useState('');

  // Upload Material Modal state
  const [materialLesson, setMaterialLesson] = useState<Lesson | null>(null);
  const [selectedMaterialFile, setSelectedMaterialFile] = useState<File | null>(null);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialType, setMaterialType] = useState<'SLIDES' | 'PDF' | 'NOTES' | 'CODE'>('PDF');
  const [materialSourceMode, setMaterialSourceMode] = useState<'FILE' | 'URL'>('FILE');
  const [materialUrl, setMaterialUrl] = useState('');
  const [materialFileName, setMaterialFileName] = useState('');
  const [materialFileSize, setMaterialFileSize] = useState(0);
  const [isSavingMaterial, setIsSavingMaterial] = useState(false);
  const [materialUploadStatus, setMaterialUploadStatus] = useState('');
  const materialFileInputRef = useRef<HTMLInputElement>(null);

  // Upload Video Modal state
  const [videoLesson, setVideoLesson] = useState<Lesson | null>(null);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoSourceMode, setVideoSourceMode] = useState<'FILE' | 'URL'>('URL');
  const [videoUrl, setVideoUrl] = useState(RELIABLE_BACKUP_VIDEO_STREAM);
  const [videoFileName, setVideoFileName] = useState('');
  const [videoDurationMin, setVideoDurationMin] = useState(15);
  const [videoTranscript, setVideoTranscript] = useState('');
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const [videoUploadStatus, setVideoUploadStatus] = useState('');
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedCourse) return;
    loadData(selectedCourse.courseId);

    // Subscribe to real-time updates so added videos are immediately available to student accounts
    const unsubVideos = subscribeToVideoLectures(selectedCourse.courseId, (updatedVideos) => {
      setVideos(updatedVideos);
    });

    const unsubMaterials = subscribeToLearningMaterials(selectedCourse.courseId, (updatedMaterials) => {
      setMaterials(updatedMaterials);
    });

    const unsubModules = subscribeToModules(selectedCourse.courseId, (updatedModules) => {
      setModules(updatedModules);
    });

    return () => {
      unsubVideos();
      unsubMaterials();
      unsubModules();
    };
  }, [selectedCourse?.courseId]);

  const loadData = async (courseId: string) => {
    const mods = await getModules(courseId);
    setModules(mods);

    const vids = await getVideoLectures(courseId);
    setVideos(vids);

    const mats = await getMaterials(courseId);
    setMaterials(mats);

    const map: Record<string, Lesson[]> = {};
    for (const m of mods) {
      map[m.moduleId] = await getLessons(m.moduleId);
    }
    setLessonsMap(map);
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleTitle.trim() || !selectedCourse) return;
    const m = await createModule(selectedCourse.courseId, newModuleTitle, newModuleDesc);
    setModules((prev) => [...prev, m]);
    setLessonsMap((prev) => ({ ...prev, [m.moduleId]: [] }));
    setExpandedModules((prev) => ({ ...prev, [m.moduleId]: true }));
    setShowAddModuleModal(false);
    setNewModuleTitle('');
    setNewModuleDesc('');
    addToast('Module created successfully!', 'success');
  };

  const handleCreateLesson = async (e: React.FormEvent, moduleId: string) => {
    e.preventDefault();
    if (!newLessonTitle.trim() || !selectedCourse) return;
    const l = await createLesson({
      moduleId,
      courseId: selectedCourse.courseId,
      title: newLessonTitle,
      content: newLessonContent,
      durationMin: 25,
      orderIndex: (lessonsMap[moduleId]?.length || 0) + 1
    });
    setLessonsMap((prev) => ({
      ...prev,
      [moduleId]: [...(prev[moduleId] || []), l]
    }));
    setShowAddLessonModal(null);
    setNewLessonTitle('');
    setNewLessonContent('');
    addToast('Lesson added to module!', 'success');
  };

  // Open Material Modal
  const handleOpenMaterialModal = (lesson: Lesson) => {
    setMaterialLesson(lesson);
    setSelectedMaterialFile(null);
    setMaterialUploadStatus('');
    setMaterialTitle(`${lesson.title} - Handout & Reading`);
    setMaterialType('PDF');
    setMaterialSourceMode('FILE');
    setMaterialUrl('');
    setMaterialFileName('');
    setMaterialFileSize(0);
  };

  const handleMaterialFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedMaterialFile(file);
    setMaterialFileName(file.name);
    setMaterialFileSize(file.size);
    if (!materialTitle || materialTitle.includes('Handout & Reading') || materialTitle.includes('Slides & Handout')) {
      setMaterialTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
    if (file.name.endsWith('.pdf')) setMaterialType('PDF');
    else if (file.name.endsWith('.ppt') || file.name.endsWith('.pptx') || file.name.endsWith('.key')) setMaterialType('SLIDES');
    else if (file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.docx')) setMaterialType('NOTES');
    else if (file.name.endsWith('.zip') || file.name.endsWith('.js') || file.name.endsWith('.py') || file.name.endsWith('.sql')) setMaterialType('CODE');
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialLesson || !selectedCourse || !materialTitle.trim()) return;
    setIsSavingMaterial(true);
    setMaterialUploadStatus('Preparing material...');
    try {
      let finalUrl = materialUrl.trim();
      let finalSize = materialFileSize;

      if (materialSourceMode === 'FILE' && selectedMaterialFile) {
        setMaterialUploadStatus('Saving file permanently to Firebase Store...');
        const stored = await saveFileToFirestore(
          selectedMaterialFile,
          materialTitle.trim(),
          selectedMaterialFile.type,
          (msg) => setMaterialUploadStatus(msg)
        );
        finalUrl = stored.storageUrl;
        finalSize = stored.sizeBytes;
      } else if (!finalUrl) {
        finalUrl = 'https://example.com/handout.pdf';
      }

      const newMat = await addMaterial({
        lessonId: materialLesson.lessonId,
        courseId: selectedCourse.courseId,
        title: materialTitle.trim(),
        type: materialType,
        url: finalUrl,
        sizeBytes: finalSize > 0 ? finalSize : 102400
      });

      setMaterials((prev) => [...prev.filter((m) => m.materialId !== newMat.materialId), newMat]);
      addToast(`Material "${newMat.title}" saved to Firebase Store!`, 'success');
      setMaterialLesson(null);
      setSelectedMaterialFile(null);
    } catch (err) {
      console.error('Failed to save material:', err);
      addToast('Failed to upload material to Firebase.', 'error');
    } finally {
      setIsSavingMaterial(false);
      setMaterialUploadStatus('');
    }
  };

  const handleDeleteMaterial = async (materialId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the material "${title}"?`)) return;
    try {
      await deleteMaterial(materialId);
      setMaterials((prev) => prev.filter((m) => m.materialId !== materialId));
      addToast('Material deleted successfully.', 'info');
    } catch (err) {
      addToast('Failed to delete material.', 'error');
    }
  };

  // Open Video Modal
  const handleOpenVideoModal = (lesson: Lesson, existingVideo?: VideoLecture) => {
    setVideoLesson(lesson);
    setSelectedVideoFile(null);
    setVideoUploadStatus('');
    if (existingVideo) {
      setEditingVideoId(existingVideo.videoId);
      setVideoTitle(existingVideo.title);
      setVideoSourceMode(existingVideo.url.startsWith('indexeddb://') || existingVideo.url.startsWith('blob:') ? 'FILE' : 'URL');
      setVideoUrl(existingVideo.url);
      setVideoFileName(existingVideo.url.startsWith('indexeddb://') ? 'Saved Local Video File' : '');
      setVideoDurationMin(Math.round((existingVideo.durationSec || 900) / 60));
      setVideoTranscript(existingVideo.transcript || '');
    } else {
      setEditingVideoId(null);
      setVideoTitle(`${lesson.title} - Video Lecture`);
      setVideoSourceMode('URL');
      setVideoUrl(RELIABLE_BACKUP_VIDEO_STREAM);
      setVideoFileName('');
      setVideoDurationMin(15);
      setVideoTranscript('');
    }
  };

  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedVideoFile(file);
    setVideoFileName(file.name);
    if (!videoTitle || videoTitle.includes('Video Lecture')) {
      setVideoTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
    const blobUrl = URL.createObjectURL(file);
    setVideoUrl(blobUrl);

    // Auto-detect duration from video metadata
    try {
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.src = blobUrl;
      tempVideo.onloadedmetadata = () => {
        if (tempVideo.duration && isFinite(tempVideo.duration) && tempVideo.duration > 0) {
          const detectedMins = Math.max(1, Math.round(tempVideo.duration / 60));
          setVideoDurationMin(detectedMins);
        }
      };
    } catch {
      // ignore
    }
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoLesson || !selectedCourse || !videoTitle.trim()) return;
    setIsSavingVideo(true);
    setVideoUploadStatus('Preparing video lecture...');
    try {
      let finalUrl = videoUrl.trim();
      let finalThumbnail = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80';

      // If user uploaded a video file, persist it directly to persistent browser IndexedDB
      if (videoSourceMode === 'FILE' && selectedVideoFile) {
        setVideoUploadStatus(`Capturing video preview frame...`);
        try {
          finalThumbnail = await captureVideoThumbnail(selectedVideoFile);
        } catch {
          // fallback
        }

        setVideoUploadStatus(`Saving ${selectedVideoFile.name} to persistent storage...`);
        const storedMedia = await saveMediaFile(
          selectedVideoFile,
          'video',
          `${selectedCourse.courseId}_${videoLesson.lessonId}_${selectedVideoFile.name}`,
          (statusMsg) => setVideoUploadStatus(statusMsg)
        );
        finalUrl = storedMedia.url;
        addToast(`Video "${videoTitle.trim()}" saved to persistent media storage!`, 'success');
      } else if (!finalUrl) {
        finalUrl = RELIABLE_BACKUP_VIDEO_STREAM;
      }

      const durationSec = (videoDurationMin || 15) * 60;
      const cleanTranscript = videoTranscript.trim() || undefined;

      if (editingVideoId) {
        setVideoUploadStatus('Updating lecture record...');
        await updateVideoLecture(editingVideoId, {
          title: videoTitle.trim(),
          url: finalUrl,
          durationSec,
          thumbnailUrl: finalThumbnail,
          transcript: cleanTranscript
        });
        const updatedVid: VideoLecture = {
          videoId: editingVideoId,
          lessonId: videoLesson.lessonId,
          courseId: selectedCourse.courseId,
          title: videoTitle.trim(),
          url: finalUrl,
          durationSec,
          thumbnailUrl: finalThumbnail,
          uploadedBy: currentUser?.fullName || 'Faculty Instructor',
          transcript: cleanTranscript
        };
        setVideos((prev) => prev.map((v) => (v.videoId === editingVideoId ? updatedVid : v)));
        addToast(`Video lecture updated successfully!`, 'success');
      } else {
        setVideoUploadStatus('Publishing video to course module...');
        const newVid = await addVideoLecture({
          lessonId: videoLesson.lessonId,
          courseId: selectedCourse.courseId,
          title: videoTitle.trim(),
          url: finalUrl,
          durationSec,
          thumbnailUrl: finalThumbnail,
          uploadedBy: currentUser?.fullName || 'Faculty Instructor',
          transcript: cleanTranscript
        });
        setVideos((prev) => [...prev.filter((v) => v.lessonId !== videoLesson.lessonId), newVid]);
        addToast(`Video lecture attached to "${videoLesson.title}"!`, 'success');
      }

      setVideoLesson(null);
      setSelectedVideoFile(null);
      setEditingVideoId(null);
    } catch (err) {
      console.error('Failed to save video:', err);
      addToast('Failed to save video lecture. Please try again.', 'error');
    } finally {
      setIsSavingVideo(false);
      setVideoUploadStatus('');
    }
  };

  const handleDeleteVideo = async (videoId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove the video lecture "${title}"?`)) return;
    try {
      await deleteVideoLecture(videoId);
      setVideos((prev) => prev.filter((v) => v.videoId !== videoId));
      addToast('Video lecture removed.', 'info');
    } catch (err) {
      addToast('Failed to remove video lecture.', 'error');
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '1.2 MB';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getMaterialBadge = (type: 'PDF' | 'SLIDES' | 'NOTES' | 'CODE') => {
    switch (type) {
      case 'SLIDES':
        return { label: 'Slides', bg: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Presentation };
      case 'PDF':
        return { label: 'PDF Doc', bg: 'bg-rose-50 text-rose-700 border-rose-200', Icon: FileText };
      case 'NOTES':
        return { label: 'Notes', bg: 'bg-blue-50 text-blue-700 border-blue-200', Icon: FileCheck };
      case 'CODE':
        return { label: 'Code', bg: 'bg-purple-50 text-purple-700 border-purple-200', Icon: Code };
      default:
        return { label: 'Document', bg: 'bg-slate-50 text-slate-700 border-slate-200', Icon: FileText };
    }
  };

  if (!selectedCourse) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] shadow-xs text-center animate-in fade-in">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#1E3A5F] mb-1">No Active Course Selected</h2>
        <p className="text-xs text-[#5B6B7C] max-w-md mx-auto mb-4">
          Please select or create a course to access flipped learning modules, videos, and reading materials.
        </p>
        {(role === 'TEACHER' || role === 'ADMIN') && (
          <button
            onClick={openCreateCourseModal}
            className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold shadow-xs transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Course
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Course Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-teal-50 text-[#0F766E] border border-teal-200">
              {selectedCourse.code}
            </span>
            <span className="text-xs text-[#5B6B7C]">
              {selectedCourse.semester} · {selectedCourse.credits} Credits
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1E3A5F]">
            {selectedCourse.title}
          </h1>
          <p className="text-xs text-[#5B6B7C] max-w-2xl mt-1">
            {selectedCourse.description}
          </p>
        </div>

        {role === 'TEACHER' && (
          <div className="flex items-center gap-2">
            <button
              id="create-module-btn"
              onClick={() => setShowAddModuleModal(true)}
              className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              Add New Module
            </button>
          </div>
        )}
      </div>

      {/* Teacher Action Callout */}
      {role === 'TEACHER' && (
        <div className="bg-teal-50/60 border border-teal-200/80 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#0F766E] text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-[#1E3A5F]">Flipped Classroom Syllabus & Content Management</div>
            <p className="text-[#5B6B7C] mt-0.5 leading-relaxed">
              Create syllabus modules, add structured lessons, and attach pre-class <strong>Video Lectures</strong> and <strong>Lecture Materials (PDFs, Slide Decks, Study Notes, or Lab Code)</strong>. Students will study these before attending physical classroom sessions.
            </p>
          </div>
        </div>
      )}

      {modules.length === 0 && (
        <div className="bg-white rounded-2xl p-10 border border-dashed border-[#E2E8F0] text-center shadow-xs">
          <BookOpen className="w-8 h-8 text-[#0F766E] mx-auto mb-2 opacity-60" />
          <h3 className="text-sm font-bold text-[#1E3A5F]">No Syllabus Modules Yet</h3>
          <p className="text-xs text-[#5B6B7C] max-w-sm mx-auto mt-1 mb-4">
            {role === 'TEACHER'
              ? 'Click "Add New Module" to create the first flipped learning module with videos and notes.'
              : 'Your instructor has not added modules to this course yet.'}
          </p>
          {role === 'TEACHER' && (
            <button
              onClick={() => setShowAddModuleModal(true)}
              className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              + Add First Module
            </button>
          )}
        </div>
      )}

      {/* Modules List Accordion */}
      <div className="space-y-4">
        {modules.map((mod, modIdx) => {
          const isExpanded = expandedModules[mod.moduleId] ?? false;
          const lessons = lessonsMap[mod.moduleId] || [];

          return (
            <div
              key={mod.moduleId}
              className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden transition"
            >
              {/* Module Header Bar */}
              <div
                onClick={() => toggleModule(mod.moduleId)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-[#F7F9FB] transition select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#0F766E] font-bold text-xs flex items-center justify-center border border-teal-200">
                    {modIdx + 1}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#1E3A5F]">
                      {mod.title}
                    </h2>
                    <p className="text-[11px] text-[#5B6B7C]">
                      {mod.description} · {lessons.length} {lessons.length === 1 ? 'Lesson' : 'Lessons'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#5B6B7C] hidden sm:inline">
                    {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-[#5B6B7C]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#5B6B7C]" />
                  )}
                </div>
              </div>

              {/* Module Body Content */}
              {isExpanded && (
                <div className="p-5 pt-0 border-t border-[#E2E8F0] divide-y divide-slate-100">
                  {/* Lessons List */}
                  {lessons.map((lesson, lIdx) => {
                    const video = videos.find((v) => v.lessonId === lesson.lessonId || (lesson.videoId && v.videoId === lesson.videoId));
                    const lessonMaterials = materials.filter((m) => m.lessonId === lesson.lessonId);

                    return (
                      <div key={lesson.lessonId} className="py-5 space-y-4">
                        {/* Lesson Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="font-semibold text-xs sm:text-sm text-[#0F172A] flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center">
                                {lIdx + 1}
                              </span>
                              <span>{lesson.title}</span>
                              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                {lesson.durationMin} min study
                              </span>
                            </div>
                            {lesson.content && (
                              <p className="text-xs text-[#5B6B7C] leading-relaxed pl-7">
                                {lesson.content}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Associated Media Strip: Video & Materials */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pl-0 sm:pl-7">
                          {/* Column 1: Video Lecture (5 cols) */}
                          <div className="lg:col-span-5 space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-bold text-[#1E3A5F] uppercase tracking-wider">
                              <span className="flex items-center gap-1.5">
                                <Video className="w-3.5 h-3.5 text-[#0F766E]" /> Video Lecture
                              </span>
                              {role === 'TEACHER' && video && (
                                <button
                                  onClick={() => handleOpenVideoModal(lesson, video)}
                                  className="text-[#0F766E] hover:underline font-semibold text-[10px] normal-case"
                                >
                                  Edit Video
                                </button>
                              )}
                            </div>

                            {video ? (
                              <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/40 flex flex-col justify-between gap-3 transition">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-[#0F766E] text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <Video className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-xs text-[#1E3A5F] truncate">
                                      {video.title}
                                    </div>
                                    <div className="text-[10px] text-[#5B6B7C] flex items-center gap-2 mt-0.5">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {(video.durationSec / 60).toFixed(0)} mins
                                      </span>
                                      <span>•</span>
                                      <span>By {video.uploadedBy || 'Instructor'}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-1 border-t border-teal-200/60">
                                  <button
                                    onClick={() => setActiveVideo(video)}
                                    className="px-3 py-1.5 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                                  >
                                    <PlayCircle className="w-3.5 h-3.5" />
                                    Watch Lecture
                                  </button>

                                  {role === 'TEACHER' && (
                                    <button
                                      onClick={() => handleDeleteVideo(video.videoId, video.title)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                      title="Remove Video"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 rounded-xl border border-dashed border-[#E2E8F0] bg-[#F7F9FB] text-center space-y-2">
                                <p className="text-xs text-[#5B6B7C]">No video attached to this lesson.</p>
                                {role === 'TEACHER' ? (
                                  <button
                                    onClick={() => handleOpenVideoModal(lesson)}
                                    className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:border-teal-400 text-[#0F766E] rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 mx-auto transition"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    Upload Video Lecture
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-slate-400">Awaiting instructor upload</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Column 2: Materials & Slides (7 cols) */}
                          <div className="lg:col-span-7 space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-bold text-[#1E3A5F] uppercase tracking-wider">
                              <span className="flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-[#0F766E]" />
                                Lecture Materials & Handouts ({lessonMaterials.length})
                              </span>
                              {role === 'TEACHER' && (
                                <button
                                  onClick={() => handleOpenMaterialModal(lesson)}
                                  className="px-2.5 py-1 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-xs transition"
                                >
                                  <Plus className="w-3 h-3" />
                                  Upload Material
                                </button>
                              )}
                            </div>

                            {lessonMaterials.length > 0 ? (
                              <div className="space-y-2">
                                {lessonMaterials.map((mat) => {
                                  const { label, bg, Icon } = getMaterialBadge(mat.type);
                                  return (
                                    <div
                                      key={mat.materialId}
                                      onClick={() => setActiveMaterial(mat)}
                                      className="p-3 rounded-xl border border-[#E2E8F0] bg-white hover:border-teal-300 hover:shadow-xs transition flex items-center justify-between gap-3 shadow-2xs cursor-pointer group"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-[#EEF3F7] group-hover:bg-teal-50 text-[#1E3A5F] group-hover:text-[#0F766E] flex items-center justify-center shrink-0 transition">
                                          <Icon className="w-4 h-4 text-[#0F766E]" />
                                        </div>
                                        <div className="min-w-0">
                                          <div className="font-semibold text-xs text-[#1E3A5F] group-hover:text-[#0F766E] truncate transition">
                                            {mat.title}
                                          </div>
                                          <div className="flex items-center gap-2 text-[10px] text-[#5B6B7C] mt-0.5">
                                            <span className={`px-1.5 py-0.2 rounded font-bold uppercase border ${bg}`}>
                                              {label}
                                            </span>
                                            <span>•</span>
                                            <span>{formatBytes(mat.sizeBytes)}</span>
                                            <span>•</span>
                                            <span className="text-teal-700 font-medium">Firebase Stored</span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <button
                                          type="button"
                                          onClick={() => setActiveMaterial(mat)}
                                          className="px-2.5 py-1.5 bg-[#EEF3F7] hover:bg-teal-50 hover:text-[#0F766E] text-[#1E3A5F] rounded-lg text-xs font-semibold flex items-center gap-1 transition border border-transparent hover:border-teal-200 cursor-pointer"
                                        >
                                          <FileText className="w-3.5 h-3.5 text-[#0F766E]" />
                                          <span className="hidden sm:inline">View / Download</span>
                                        </button>

                                        {role === 'TEACHER' && (
                                          <button
                                            onClick={() => handleDeleteMaterial(mat.materialId, mat.title)}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                            title="Delete Material"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="p-4 rounded-xl border border-dashed border-[#E2E8F0] bg-[#F7F9FB] text-center space-y-2">
                                <p className="text-xs text-[#5B6B7C]">No lecture slides, notes, or code attached to this lesson.</p>
                                {role === 'TEACHER' ? (
                                  <button
                                    onClick={() => handleOpenMaterialModal(lesson)}
                                    className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:border-teal-400 text-[#0F766E] rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 mx-auto transition"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    Upload Lecture Material
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-slate-400">No pre-class materials required</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Teacher Add Lesson Button */}
                  {role === 'TEACHER' && (
                    <div className="pt-3">
                      <button
                        onClick={() => setShowAddLessonModal(mod.moduleId)}
                        className="text-xs font-semibold text-[#0F766E] hover:underline flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-teal-50/50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add New Lesson to {mod.title}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Video Modal */}
      {activeVideo && (
        <VideoPlayerModal
          video={activeVideo}
          materials={materials.filter((m) => m.lessonId === activeVideo.lessonId)}
          onClose={() => setActiveVideo(null)}
          onNavigateToQuiz={onNavigateToQuiz}
        />
      )}

      {/* Material Document Viewer Modal */}
      {activeMaterial && (
        <MaterialViewerModal
          material={activeMaterial}
          onClose={() => setActiveMaterial(null)}
          onMaterialUpdated={(updated) => {
            setMaterials((prev) => prev.map((m) => (m.materialId === updated.materialId ? updated : m)));
            setActiveMaterial(updated);
          }}
        />
      )}

      {/* MODAL 1: Upload Lecture Material */}
      {materialLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl border border-[#E2E8F0] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-bold text-[#0F766E] uppercase tracking-wider">
                  Target Lesson: {materialLesson.title}
                </span>
                <h3 className="text-base font-bold text-[#1E3A5F]">
                  Upload Lecture Material
                </h3>
              </div>
              <button
                onClick={() => setMaterialLesson(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-4">
              {/* Material Title */}
              <div>
                <label className="block text-xs font-semibold text-[#1E3A5F] mb-1">
                  Document / Material Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lecture 03 - Slide Deck: Indexing & B-Trees"
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                />
              </div>

              {/* Material Type Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#1E3A5F] mb-1.5">
                  Material Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'SLIDES', label: 'Slides', Icon: Presentation, desc: 'PPT / Keynote / Slides' },
                    { id: 'PDF', label: 'PDF Book', Icon: FileText, desc: 'Handout / PDF reading' },
                    { id: 'NOTES', label: 'Notes', Icon: FileCheck, desc: 'Class Study Guide' },
                    { id: 'CODE', label: 'Code', Icon: Code, desc: 'Starter code repo' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMaterialType(item.id as any)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col items-center justify-center text-center transition ${
                        materialType === item.id
                          ? 'border-[#0F766E] bg-teal-50/70 text-[#0F766E] font-bold shadow-2xs'
                          : 'border-[#E2E8F0] bg-white text-[#5B6B7C] hover:bg-slate-50'
                      }`}
                    >
                      <item.Icon className="w-4 h-4 mb-1 text-[#0F766E]" />
                      <span className="text-xs">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Switcher */}
              <div>
                <label className="block text-xs font-semibold text-[#1E3A5F] mb-1.5">
                  File Attachment Method
                </label>
                <div className="flex rounded-xl bg-slate-100 p-1 mb-2">
                  <button
                    type="button"
                    onClick={() => setMaterialSourceMode('FILE')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                      materialSourceMode === 'FILE'
                        ? 'bg-white text-[#1E3A5F] shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Upload File from Computer
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaterialSourceMode('URL')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                      materialSourceMode === 'URL'
                        ? 'bg-white text-[#1E3A5F] shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    External Link / Cloud Drive URL
                  </button>
                </div>

                {materialSourceMode === 'FILE' ? (
                  <div>
                    <input
                      type="file"
                      ref={materialFileInputRef}
                      onChange={handleMaterialFileSelect}
                      accept=".pdf,.ppt,.pptx,.key,.doc,.docx,.txt,.md,.zip,.py,.js"
                      className="hidden"
                    />
                    <div
                      onClick={() => materialFileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
                        materialFileName
                          ? 'border-emerald-300 bg-emerald-50/40'
                          : 'border-[#E2E8F0] hover:border-teal-400 bg-slate-50/50'
                      }`}
                    >
                      {materialFileName ? (
                        <div className="flex items-center justify-center gap-2 text-emerald-800">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <div className="text-xs font-bold truncate max-w-xs">{materialFileName}</div>
                          <span className="text-[10px] text-emerald-600">({formatBytes(materialFileSize)})</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Upload className="w-6 h-6 text-[#0F766E] mx-auto opacity-75" />
                          <div className="text-xs font-semibold text-[#1E3A5F]">
                            Click to browse or drag and drop file here
                          </div>
                          <div className="text-[10px] text-[#5B6B7C]">
                            Supports PDF, PowerPoint (.pptx), Word, Markdown, or Code Archives
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/... or https://example.com/lecture.pdf"
                      value={materialUrl}
                      onChange={(e) => setMaterialUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                    />
                    <p className="text-[10px] text-[#5B6B7C] mt-1">
                      Provide a direct link to Google Drive, Microsoft OneDrive, Notion, or campus web server.
                    </p>
                  </div>
                )}
              </div>

              {isSavingMaterial && materialUploadStatus && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-2.5 text-xs text-[#0F766E] font-medium">
                  <div className="w-4 h-4 border-2 border-[#0F766E] border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>{materialUploadStatus}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMaterialLesson(null)}
                  className="px-4 py-2 bg-[#EEF3F7] text-[#1E3A5F] hover:bg-[#E2E8F0] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingMaterial}
                  className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isSavingMaterial ? 'Saving...' : 'Upload & Publish Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Upload Video Lecture */}
      {videoLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl border border-[#E2E8F0] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-bold text-[#0F766E] uppercase tracking-wider">
                  Target Lesson: {videoLesson.title}
                </span>
                <h3 className="text-base font-bold text-[#1E3A5F]">
                  Upload / Attach Video Lecture
                </h3>
              </div>
              <button
                onClick={() => setVideoLesson(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVideo} className="space-y-4">
              {/* Video Title */}
              <div>
                <label className="block text-xs font-semibold text-[#1E3A5F] mb-1">
                  Video Lecture Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lecture 03 - Introduction to B-Trees & Hash Indexes"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                />
              </div>

              {/* Video Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1E3A5F] mb-1">
                    Estimated Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={videoDurationMin}
                    onChange={(e) => setVideoDurationMin(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1E3A5F] mb-1">
                    Uploaded By
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentUser?.fullName || 'Faculty Instructor'}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] bg-slate-50 text-xs text-[#5B6B7C]"
                  />
                </div>
              </div>

              {/* Source Switcher */}
              <div>
                <label className="block text-xs font-semibold text-[#1E3A5F] mb-1.5">
                  Video Source
                </label>
                <div className="flex rounded-xl bg-slate-100 p-1 mb-2">
                  <button
                    type="button"
                    onClick={() => setVideoSourceMode('URL')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                      videoSourceMode === 'URL'
                        ? 'bg-white text-[#1E3A5F] shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Video URL / Cloud Storage
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoSourceMode('FILE')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                      videoSourceMode === 'FILE'
                        ? 'bg-white text-[#1E3A5F] shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Upload MP4 Video File
                  </button>
                </div>

                {videoSourceMode === 'URL' ? (
                  <div className="space-y-2">
                    <input
                      type="url"
                      required
                      placeholder="https://... (MP4 video URL, YouTube link, or CDN)"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                    />
                    
                    {/* Quick Presets for Faculty */}
                    <div>
                      <div className="text-[11px] font-semibold text-[#1E3A5F] mb-1">
                        Or pick from Curated Department Lectures:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {SAMPLE_LECTURE_PRESETS.map((preset) => (
                          <button
                            key={preset.title}
                            type="button"
                            onClick={() => {
                              setVideoUrl(preset.url);
                              setVideoTitle(preset.title);
                              setVideoDurationMin(preset.durationMin);
                              setVideoTranscript(preset.transcript);
                            }}
                            className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-teal-50 hover:text-[#0F766E] border border-slate-200 hover:border-teal-300 rounded-lg text-slate-700 transition"
                          >
                            + {preset.title}
                          </button>
                        ))}
                      </div>
                    </div>

                    <p className="text-[10px] text-[#5B6B7C]">
                      Supports direct MP4 links, YouTube videos, Vimeo, or Google Cloud Storage endpoints.
                    </p>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      ref={videoFileInputRef}
                      onChange={handleVideoFileSelect}
                      accept="video/mp4,video/webm,video/ogg"
                      className="hidden"
                    />
                    <div
                      onClick={() => videoFileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
                        videoFileName
                          ? 'border-emerald-300 bg-emerald-50/40'
                          : 'border-[#E2E8F0] hover:border-teal-400 bg-slate-50/50'
                      }`}
                    >
                      {videoFileName ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-center gap-2 text-emerald-800">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div className="text-xs font-bold truncate max-w-xs">{videoFileName}</div>
                          </div>
                          {selectedVideoFile && (
                            <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-700 font-medium">
                              <span>{(selectedVideoFile.size / 1024 / 1024).toFixed(2)} MB</span>
                              <span>•</span>
                              <span>{videoDurationMin} mins</span>
                              <span>•</span>
                              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-semibold">Ready to Save</span>
                            </div>
                          )}
                          <div className="text-[10px] text-teal-700 hover:text-teal-900 underline font-medium">Click to select different file</div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Video className="w-6 h-6 text-[#0F766E] mx-auto opacity-75" />
                          <div className="text-xs font-semibold text-[#1E3A5F]">
                            Click to select MP4 / WebM video file
                          </div>
                          <p className="text-[10px] text-slate-500">
                            Stored in high-speed persistent browser vault with zero size limit for smooth, instant playback.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Transcript / Outline */}
              <div>
                <label className="block text-xs font-semibold text-[#1E3A5F] mb-1">
                  Video Outline / Key Timestamps (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="00:00 Introduction • 04:30 Core concept • 10:15 Practical example"
                  value={videoTranscript}
                  onChange={(e) => setVideoTranscript(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                />
              </div>

              {/* Upload Status Banner */}
              {isSavingVideo && videoUploadStatus && (
                <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-800 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-[#0F766E] border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>{videoUploadStatus}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setVideoLesson(null);
                    setSelectedVideoFile(null);
                    setEditingVideoId(null);
                  }}
                  className="px-4 py-2 bg-[#EEF3F7] text-[#1E3A5F] hover:bg-[#E2E8F0] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingVideo}
                  className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Video className="w-3.5 h-3.5" />
                  {isSavingVideo
                    ? 'Saving Video Lecture...'
                    : editingVideoId
                    ? 'Update Video Lecture'
                    : 'Attach Video Lecture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Create Module Modal */}
      {showAddModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-[#E2E8F0]">
            <h3 className="text-base font-bold text-[#1E3A5F] mb-4">Create New Learning Module</h3>
            <form onSubmit={handleCreateModule} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Module Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Module 4: Cloud Microservices Deployment"
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Module Description</label>
                <textarea
                  rows={3}
                  placeholder="Key concepts covered in this module..."
                  value={newModuleDesc}
                  onChange={(e) => setNewModuleDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModuleModal(false)}
                  className="px-4 py-2 bg-[#EEF3F7] text-[#1E3A5F] hover:bg-[#E2E8F0] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold"
                >
                  Create Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Create Lesson Modal */}
      {showAddLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-[#E2E8F0]">
            <h3 className="text-base font-bold text-[#1E3A5F] mb-4">Add Lesson</h3>
            <form onSubmit={(e) => handleCreateLesson(e, showAddLessonModal)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Lesson Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1.3 Caching Strategies with Redis"
                  value={newLessonTitle}
                  onChange={(e) => setNewLessonTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1E3A5F] mb-1">Lesson Summary / Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Outline key learning objectives for pre-class study..."
                  value={newLessonContent}
                  onChange={(e) => setNewLessonContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs focus:ring-2 focus:ring-[#0F766E] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLessonModal(null)}
                  className="px-4 py-2 bg-[#EEF3F7] text-[#1E3A5F] hover:bg-[#E2E8F0] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F59] text-white rounded-xl text-xs font-semibold"
                >
                  Add Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
