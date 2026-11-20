import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { creditService } from '../../services/creditService';
import {
  PlayCircle,
  Play,
  Pause,
  Clock,
  CheckCircle2,
  X,
  Award,
  ShieldCheck,
  Video,
  ExternalLink,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

export function formatVideoTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function md5(string: string): number[] {
  function md5_RotateLeft(lValue: number, iShiftBits: number) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }
  function md5_AddUnsigned(lX: number, lY: number) {
    const lX4 = lX & 0x40000000;
    const lY4 = lY & 0x40000000;
    const lX8 = lX & 0x80000000;
    const lY8 = lY & 0x80000000;
    const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
    if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
      else return lResult ^ 0x40000000 ^ lX8 ^ lY8;
    } else {
      return lResult ^ lX8 ^ lY8;
    }
  }
  function md5_F(x: number, y: number, z: number) { return (x & y) | (~x & z); }
  function md5_G(x: number, y: number, z: number) { return (x & z) | (y & ~z); }
  function md5_H(x: number, y: number, z: number) { return x ^ y ^ z; }
  function md5_I(x: number, y: number, z: number) { return y ^ (x | ~z); }
  function md5_FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_F(b, c, d), x), ac));
    return md5_AddUnsigned(md5_RotateLeft(a, s), b);
  }
  function md5_GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_G(b, c, d), x), ac));
    return md5_AddUnsigned(md5_RotateLeft(a, s), b);
  }
  function md5_HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_H(b, c, d), x), ac));
    return md5_AddUnsigned(md5_RotateLeft(a, s), b);
  }
  function md5_II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_I(b, c, d), x), ac));
    return md5_AddUnsigned(md5_RotateLeft(a, s), b);
  }
  function md5_ConvertToWordArray(str: string) {
    let lWordCount;
    const lMessageLength = str.length;
    const lNumberOfWords_temp1 = lMessageLength + 8;
    const lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    const lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    const lWordArray = new Array(lNumberOfWords - 1);
    let lBytePosition = 0;
    let lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = (lWordArray[lWordCount] || 0) | (str.charCodeAt(lByteCount) << lBytePosition);
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = (lWordArray[lWordCount] || 0) | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }
  function md5_WordToBytes(lValue: number) {
    return [lValue & 0xff, (lValue >>> 8) & 0xff, (lValue >>> 16) & 0xff, (lValue >>> 24) & 0xff];
  }

  const x = md5_ConvertToWordArray(string);
  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;
  const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
  const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
  const S41 = 6, S42 = 10, S43 = 15, S44 = 21;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;
    a = md5_FF(a, b, c, d, x[k + 0] || 0, S11, 0xd76aa478);
    d = md5_FF(d, a, b, c, x[k + 1] || 0, S12, 0xe8c7b756);
    c = md5_FF(c, d, a, b, x[k + 2] || 0, S13, 0x242070db);
    b = md5_FF(b, c, d, a, x[k + 3] || 0, S14, 0xc1bdceee);
    a = md5_FF(a, b, c, d, x[k + 4] || 0, S11, 0xf57c0faf);
    d = md5_FF(d, a, b, c, x[k + 5] || 0, S12, 0x4787c62a);
    c = md5_FF(c, d, a, b, x[k + 6] || 0, S13, 0xa8304613);
    b = md5_FF(b, c, d, a, x[k + 7] || 0, S14, 0xfd469501);
    a = md5_FF(a, b, c, d, x[k + 8] || 0, S11, 0x698098d8);
    d = md5_FF(d, a, b, c, x[k + 9] || 0, S12, 0x8b44f7af);
    c = md5_FF(c, d, a, b, x[k + 10] || 0, S13, 0xffff5bb1);
    b = md5_FF(b, c, d, a, x[k + 11] || 0, S14, 0x895cd7be);
    a = md5_FF(a, b, c, d, x[k + 12] || 0, S11, 0x6b901122);
    d = md5_FF(d, a, b, c, x[k + 13] || 0, S12, 0xfd987193);
    c = md5_FF(c, d, a, b, x[k + 14] || 0, S13, 0xa679438e);
    b = md5_FF(b, c, d, a, x[k + 15] || 0, S14, 0x49b40821);
    a = md5_GG(a, b, c, d, x[k + 1] || 0, S21, 0xf61e2562);
    d = md5_GG(d, a, b, c, x[k + 6] || 0, S22, 0xc040b340);
    c = md5_GG(c, d, a, b, x[k + 11] || 0, S23, 0x265e5a51);
    b = md5_GG(b, c, d, a, x[k + 0] || 0, S24, 0xe9b6c7aa);
    a = md5_GG(a, b, c, d, x[k + 5] || 0, S21, 0xd62f105d);
    d = md5_GG(d, a, b, c, x[k + 10] || 0, S22, 0x2441453);
    c = md5_GG(c, d, a, b, x[k + 15] || 0, S23, 0xd8a1e681);
    b = md5_GG(b, c, d, a, x[k + 4] || 0, S24, 0xe7d3fbc8);
    a = md5_GG(a, b, c, d, x[k + 9] || 0, S21, 0x21e1cde6);
    d = md5_GG(d, a, b, c, x[k + 14] || 0, S22, 0xc33707d6);
    c = md5_GG(c, d, a, b, x[k + 3] || 0, S23, 0xf4d50d87);
    b = md5_GG(b, c, d, a, x[k + 8] || 0, S24, 0x455a14ed);
    a = md5_GG(a, b, c, d, x[k + 13] || 0, S21, 0xa9e3e905);
    d = md5_GG(d, a, b, c, x[k + 2] || 0, S22, 0xfcefa3f8);
    c = md5_GG(c, d, a, b, x[k + 7] || 0, S23, 0x676f02d9);
    b = md5_GG(b, c, d, a, x[k + 12] || 0, S24, 0x8d2a4c8a);
    a = md5_HH(a, b, c, d, x[k + 5] || 0, S31, 0xfffa3942);
    d = md5_HH(d, a, b, c, x[k + 8] || 0, S32, 0x8771f681);
    c = md5_HH(c, d, a, b, x[k + 11] || 0, S33, 0x6d9d6122);
    b = md5_HH(b, c, d, a, x[k + 14] || 0, S34, 0xfde5380c);
    a = md5_HH(a, b, c, d, x[k + 1] || 0, S31, 0xa4beea44);
    d = md5_HH(d, a, b, c, x[k + 4] || 0, S32, 0x4bdecfa9);
    c = md5_HH(c, d, a, b, x[k + 7] || 0, S33, 0xf6bb4b60);
    b = md5_HH(b, c, d, a, x[k + 10] || 0, S34, 0xbebfbc70);
    a = md5_HH(a, b, c, d, x[k + 13] || 0, S31, 0x289b7ec6);
    d = md5_HH(d, a, b, c, x[k + 0] || 0, S32, 0xeaa127fa);
    c = md5_HH(c, d, a, b, x[k + 3] || 0, S33, 0xd4ef3085);
    b = md5_HH(b, c, d, a, x[k + 6] || 0, S34, 0x4881d05);
    a = md5_HH(a, b, c, d, x[k + 9] || 0, S31, 0xd9d4d039);
    d = md5_HH(d, a, b, c, x[k + 12] || 0, S32, 0xe6db99e5);
    c = md5_HH(c, d, a, b, x[k + 15] || 0, S33, 0x1fa27cf8);
    b = md5_HH(b, c, d, a, x[k + 2] || 0, S34, 0xc4ac5665);
    a = md5_II(a, b, c, d, x[k + 0] || 0, S41, 0xf4292244);
    d = md5_II(d, a, b, c, x[k + 7] || 0, S42, 0x432aff97);
    c = md5_II(c, d, a, b, x[k + 14] || 0, S43, 0xab9423a7);
    b = md5_II(b, c, d, a, x[k + 5] || 0, S44, 0xfc93a039);
    a = md5_II(a, b, c, d, x[k + 12] || 0, S41, 0x655b59c3);
    d = md5_II(d, a, b, c, x[k + 3] || 0, S42, 0x8f0ccc92);
    c = md5_II(c, d, a, b, x[k + 10] || 0, S43, 0xffeff47d);
    b = md5_II(b, c, d, a, x[k + 1] || 0, S44, 0x85845dd1);
    a = md5_II(a, b, c, d, x[k + 8] || 0, S41, 0x6fa87e4f);
    d = md5_II(d, a, b, c, x[k + 15] || 0, S42, 0xfe2ce6e0);
    c = md5_II(c, d, a, b, x[k + 6] || 0, S43, 0xa3014314);
    b = md5_II(b, c, d, a, x[k + 13] || 0, S44, 0x4e0811a1);
    a = md5_II(a, b, c, d, x[k + 4] || 0, S41, 0xf7537e82);
    d = md5_II(d, a, b, c, x[k + 11] || 0, S42, 0xbd3af235);
    c = md5_II(c, d, a, b, x[k + 2] || 0, S43, 0x2ad7d2bb);
    b = md5_II(b, c, d, a, x[k + 9] || 0, S44, 0xeb86d391);
    a = md5_AddUnsigned(a, AA);
    b = md5_AddUnsigned(b, BB);
    c = md5_AddUnsigned(c, CC);
    d = md5_AddUnsigned(d, DD);
  }

  return [
    ...md5_WordToBytes(a),
    ...md5_WordToBytes(b),
    ...md5_WordToBytes(c),
    ...md5_WordToBytes(d),
  ];
}

export function generateSignedBunnyUrl(videoPath: string, expirySecs = 86400): string {
  const securityKey = 'e65bff0c-9e8e-418c-937f-af7d04352d5d';
  const allowedHost = 'WGGG.b-cdn.net';
  const path = '/' + videoPath.replace(/^\/+/, '');
  const expires = Math.floor(Date.now() / 1000) + expirySecs;
  const hashableBase = securityKey + path + expires;

  const rawBytes = md5(hashableBase);
  let binary = '';
  for (let i = 0; i < rawBytes.length; i++) {
    binary += String.fromCharCode(rawBytes[i]);
  }
  const token = btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `https://${allowedHost}${path}?token=${token}&expires=${expires}`;
}

export const StudentTutorialsPage: React.FC = () => {
  const { user } = useAuth();
  const studentId = user?._id || user?.id || 'CURRENT_STUDENT';

  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
  const [isVideoBuffering, setIsVideoBuffering] = useState<boolean>(false);
  const [videoLoadError, setVideoLoadError] = useState<string | null>(null);
  const [seekWarning, setSeekWarning] = useState<string | null>(null);
  const [resumeNotice, setResumeNotice] = useState<{ time: number; formatted: string } | null>(null);
  const resumeTimeoutRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const maxWatchedTimeRef = useRef<number>(0);
  const hasRestoredTimeRef = useRef<boolean>(false);
  const [watchPercent, setWatchPercent] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [celebrationToast, setCelebrationToast] = useState<string | null>(null);
  const [progressState, setProgressState] = useState<
    Record<string, { percentage: number; isCredited: boolean; lastStoppedTime?: number; duration?: number }>
  >({});

  const tutorials = [
    {
      id: 'py_creating_app',
      title: 'Python: Creating an Application',
      duration: 'Lesson 1',
      category: 'Python',
      desc: 'Hands-on tutorial on developing, structuring, and running an application using Python.',
      videoPath: 'python/27-CreatingApp.mp4',
    },
    {
      id: 'uiux_js_action',
      title: 'JavaScript in Action: Interactive Elements',
      duration: 'Lesson 2',
      category: 'UI / UX',
      desc: 'Implementing interactive UI actions, dynamic event handlers, and responsive browser behaviors.',
      videoPath: 'uiux/13-JSAction.mp4',
    },
    {
      id: 'uiux_type_conv',
      title: 'JavaScript: Type Conversion & Data Types',
      duration: 'Lesson 3',
      category: 'UI / UX',
      desc: 'Understanding data types, type casting, implicit coercion, and best practices in JavaScript.',
      videoPath: 'uiux/17-TypeConversion.mp4',
    },
    {
      id: 'uiux_ui_part1',
      title: 'UI Design & Component Architecture (Part 1)',
      duration: 'Lesson 4',
      category: 'UI / UX',
      desc: 'Core layout principles, component visual hierarchy, and modern UI design techniques.',
      videoPath: 'uiux/18-UIPart1.mp4',
    },
  ];

  const [rulesState, setRulesState] = useState(() => creditService.getRules());

  useEffect(() => {
    // 1. Fetch latest rules from backend on mount
    creditService.fetchRulesApi(user?.company_id).then(() => {
      setRulesState(creditService.getRules());
    });

    // 2. Listen to rules update events
    const handleRulesUpdate = () => {
      setRulesState(creditService.getRules());
    };
    window.addEventListener('wegrow_credit_rules_updated', handleRulesUpdate);
    return () => window.removeEventListener('wegrow_credit_rules_updated', handleRulesUpdate);
  }, [user?.company_id]);

  const requiredWatchPct = rulesState?.video_completion?.required_watch_pct ?? 80;
  const totalVideoPoolCredits = rulesState?.video_completion?.credits ?? 10;
  const totalVideos = tutorials.length;
  // Approach B: Proportional split of Admin's configured pool across all lessons
  const creditPerVideo = totalVideos > 0 
    ? Number((totalVideoPoolCredits / totalVideos).toFixed(2)) 
    : totalVideoPoolCredits;

  // Load progress for all videos from local storage
  const reloadProgress = () => {
    const map: Record<string, { percentage: number; isCredited: boolean; lastStoppedTime?: number; duration?: number }> = {};
    tutorials.forEach((t) => {
      map[t.id] = creditService.getVideoWatchProgress(studentId, `vid_${t.id}`);
    });
    setProgressState(map);
  };

  useEffect(() => {
    // Clear old mock lesson IDs to eliminate false '100% completed' state on newly mounted lessons
    ['1', '2', '3', '4', '5', '6'].forEach((oldId) => {
      try {
        localStorage.removeItem(`wegrow_video_prog_${studentId}_vid_${oldId}`);
      } catch (e) {}
    });
    reloadProgress();
  }, [studentId]);

  const handleResetAllProgress = () => {
    if (window.confirm('Reset watch progress for all 4 lessons to 0%?')) {
      tutorials.forEach((t) => {
        try {
          localStorage.removeItem(`wegrow_video_prog_${studentId}_vid_${t.id}`);
        } catch (e) {}
      });
      ['1', '2', '3', '4', '5', '6'].forEach((oldId) => {
        try {
          localStorage.removeItem(`wegrow_video_prog_${studentId}_vid_${oldId}`);
        } catch (e) {}
      });
      reloadProgress();
      setCelebrationToast('Watch progress has been reset for all lessons!');
      setTimeout(() => setCelebrationToast(null), 3500);
    }
  };

  // Handle auto-progress when student watches (stable threshold check & one-time award)
  const handleAutoProgress = (currentPct: number, currentTime?: number, duration?: number) => {
    if (!selectedVideo) return;

    // Check if this video is already credited
    const videoKey = `vid_${selectedVideo.id}`;
    const currentProg = progressState[selectedVideo.id] || creditService.getVideoWatchProgress(studentId, videoKey);
    if (currentProg?.isCredited) {
      // Already completed & credited: only save position for resume, never award again
      if (currentTime !== undefined) {
        creditService.saveVideoPlaybackPosition(studentId, videoKey, currentTime, duration);
      }
      return;
    }

    setWatchPercent((prev) => {
      // Only trigger updates when the percentage actually moves forward
      if (currentPct <= prev) return prev;

      const res = creditService.updateVideoProgress(
        studentId,
        videoKey,
        selectedVideo.title,
        currentPct,
        currentTime,
        duration,
        creditPerVideo,
      );

      if (res.awarded) {
        reloadProgress();
        setCelebrationToast(`🎉 Achievement Unlocked! You watched ${res.newPercentage}% and earned +${res.credits} credits!`);
        setTimeout(() => setCelebrationToast(null), 6000);
      }

      return currentPct;
    });
  };

  // Restore playback from last stopped position
  const restoreStoppedPlayback = (vid: HTMLVideoElement) => {
    if (hasRestoredTimeRef.current || !selectedVideo) return;
    const initialProg = creditService.getVideoWatchProgress(studentId, `vid_${selectedVideo.id}`);
    const savedTime = initialProg?.lastStoppedTime || 0;
    if (savedTime > 2 && vid.duration && savedTime < vid.duration - 2) {
      vid.currentTime = savedTime;
      maxWatchedTimeRef.current = Math.max(maxWatchedTimeRef.current, savedTime);
      hasRestoredTimeRef.current = true;
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
      setResumeNotice({
        time: savedTime,
        formatted: formatVideoTime(savedTime),
      });
      resumeTimeoutRef.current = setTimeout(() => {
        setResumeNotice(null);
      }, 7000);
    } else {
      hasRestoredTimeRef.current = true;
    }
  };

  // Toggle Play / Pause playback
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch((err) => {
        console.warn('Playback play prevented:', err);
      });
    } else {
      videoRef.current.pause();
    }
  };

  // Save current playback position and close modal
  const handleCloseModal = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    setResumeNotice(null);
    setVideoLoadError(null);
    if (videoRef.current && selectedVideo) {
      creditService.saveVideoPlaybackPosition(
        studentId,
        `vid_${selectedVideo.id}`,
        videoRef.current.currentTime,
        videoRef.current.duration,
      );
      reloadProgress();
    }
    setSelectedVideo(null);
  };

  // Generate signed URL once when video modal is opened
  useEffect(() => {
    if (!selectedVideo) {
      setCurrentVideoUrl('');
      setIsPlaying(false);
      setIsVideoBuffering(false);
      maxWatchedTimeRef.current = 0;
      setSeekWarning(null);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
      setResumeNotice(null);
      hasRestoredTimeRef.current = false;
      return;
    }

    const signed = generateSignedBunnyUrl(selectedVideo.videoPath || 'python/27-CreatingApp.mp4');
    setCurrentVideoUrl(signed);
    const initialProg = creditService.getVideoWatchProgress(studentId, `vid_${selectedVideo.id}`);
    setWatchPercent(initialProg?.percentage || 0);
    const stoppedTime = initialProg?.lastStoppedTime || 0;
    maxWatchedTimeRef.current = stoppedTime;
    setSeekWarning(null);
    hasRestoredTimeRef.current = false;

    if (stoppedTime > 2) {
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
      setResumeNotice({
        time: stoppedTime,
        formatted: formatVideoTime(stoppedTime),
      });
      resumeTimeoutRef.current = setTimeout(() => {
        setResumeNotice(null);
      }, 7000);
    } else {
      setResumeNotice(null);
    }

    return () => {
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, [selectedVideo, studentId]);

  const completedCount = Object.values(progressState).filter((p) => p?.isCredited).length;
  const totalCreditsEarned = completedCount === totalVideos && totalVideos > 0
    ? totalVideoPoolCredits
    : Number((completedCount * creditPerVideo).toFixed(2));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast Alert */}
      {celebrationToast && (
        <div className="fixed top-6 right-6 z-50 animate-bounce flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xl border border-emerald-400">
          <Award className="w-6 h-6 text-amber-300 flex-shrink-0" />
          <div className="font-bold text-sm">{celebrationToast}</div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-500/20 text-white">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            <span>Course Video Tutorials</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-400/30">
              {tutorials.length} Lessons Available
            </span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Watch any video freely. When your playback reaches <strong className="text-amber-400">{requiredWatchPct}%</strong>, you earn <strong className="text-emerald-400">+{creditPerVideo} credits</strong> per lesson (Admin Pool: <strong className="text-amber-300">{totalVideoPoolCredits} credits</strong> divided across {totalVideos} lessons).
          </p>
        </div>

        {/* Video Credits Score Pill */}
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/15">
          <div className="p-2.5 bg-amber-400/20 rounded-lg text-amber-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Video Pool Progress</div>
            <div className="text-xl font-extrabold text-white">
              {totalCreditsEarned} <span className="text-xs font-normal text-amber-300">/ {totalVideoPoolCredits} pts</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400 mt-0.5">
              <span>{completedCount} of {totalVideos} completed</span>
              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetAllProgress}
                  className="text-amber-300 hover:text-white underline font-bold transition"
                  title="Reset watch history to 0%"
                >
                  Reset All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Tutorial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {tutorials.map((t) => {
          const prog = progressState[t.id] || { percentage: 0, isCredited: false };
          const isDone = prog.isCredited;

          return (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col hover:border-indigo-300 hover:shadow-md transition-all group cursor-pointer"
              onClick={() => setSelectedVideo(t)}
            >
              {/* Thumbnail Canvas */}
              <div className="h-40 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-4 flex flex-col justify-between relative overflow-hidden">
                <div className="flex justify-between items-start z-10">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white/20 text-white backdrop-blur-xs">
                    {t.category}
                  </span>
                  <span className="text-xs font-bold text-white/90 flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-md">
                    <Clock className="w-3 h-3" />
                    {prog?.duration && prog.duration > 0 ? formatVideoTime(prog.duration) : t.duration}
                  </span>
                </div>

                <div className="flex items-center justify-center my-auto z-10">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-indigo-600 transition-all">
                    <PlayCircle className="w-7 h-7" />
                  </div>
                </div>

                {/* Status Overlay - Positioned cleanly at bottom-right of thumbnail to eliminate top tag collision */}
                {isDone && (
                  <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-lg border border-emerald-400/40 backdrop-blur-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    +{creditPerVideo} Credits Claimed
                  </div>
                )}

                {/* Decorative Glow */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />
              </div>

              {/* Content Details */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-2">
                    {t.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{t.desc}</p>
                </div>

                {/* Progress bar & Action Button */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="font-semibold text-slate-600 flex items-center gap-1.5 flex-wrap">
                        {isDone ? (
                          <span className="text-emerald-600 font-bold">Completed</span>
                        ) : (
                          <>
                            <span>{prog.percentage}% watched</span>
                            {prog.lastStoppedTime && prog.lastStoppedTime > 0 ? (
                              <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-indigo-500" />
                                Stopped at {formatVideoTime(prog.lastStoppedTime)}
                              </span>
                            ) : null}
                          </>
                        )}
                      </span>
                      <span className={isDone ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                        Target: {requiredWatchPct}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isDone ? 'bg-emerald-500' : prog.percentage > 0 ? 'bg-indigo-600' : 'bg-transparent'
                        }`}
                        style={{ width: `${Math.min(prog.percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Direct Watch Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVideo(t);
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer ${
                      isDone
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        : prog.percentage > 0
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {isDone ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Rewatch Lesson</span>
                      </>
                    ) : prog.percentage > 0 ? (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Resume Lesson ({prog.percentage}%)</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Watch Video Lesson</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Video Modal Player (Automated Watch Tracker, No Student Cheat Controls) */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="bg-slate-900 text-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-white">{selectedVideo.title}</h3>
                  {resumeNotice && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-indigo-500/40 text-xs text-slate-200 shadow-sm animate-in fade-in duration-300">
                      <Clock className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span>
                        Resumed from <strong className="text-amber-400 font-mono">{resumeNotice.formatted}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.currentTime = 0;
                            setResumeNotice(null);
                          }
                        }}
                        className="ml-1 text-[11px] text-indigo-300 hover:text-white underline flex items-center gap-0.5 transition"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        Restart from 0:00
                      </button>
                      <button
                        type="button"
                        onClick={() => setResumeNotice(null)}
                        className="p-0.5 text-slate-400 hover:text-white rounded ml-1 transition"
                        title="Dismiss notice"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {selectedVideo.duration} • {selectedVideo.category} • Staff Threshold: {requiredWatchPct}% for +{creditPerVideo} credits (Pool: {totalVideoPoolCredits} pts)
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {currentVideoUrl && user?.user_type !== 'student' && (
                  <a
                    href={currentVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open in new window"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5 text-xs bg-slate-800/60 border border-slate-700/60"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Pop-out</span>
                  </a>
                )}
                <button
                  onClick={handleCloseModal}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Close Video"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Live HTML5 Video Player Container (With Anti-Cheat Forward-Seek Protection & Auto-Resume) */}
            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-inner border border-slate-800 relative flex items-center justify-center group">
              {seekWarning && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-2xl animate-bounce border border-amber-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{seekWarning}</span>
                </div>
              )}

              {isVideoBuffering && !videoLoadError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs z-20 pointer-events-none">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <span className="text-xs text-slate-300 font-medium">Buffering video...</span>
                </div>
              )}

              {videoLoadError && (
                <div className="absolute inset-0 z-40 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-rose-500 flex-shrink-0" />
                  <p className="text-sm font-bold text-white max-w-md">{videoLoadError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoLoadError(null);
                      setIsVideoBuffering(true);
                      if (selectedVideo) {
                        setCurrentVideoUrl(generateSignedBunnyUrl(selectedVideo.videoPath));
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Video Stream</span>
                  </button>
                </div>
              )}

              {/* Center Play / Pause Floating Button (Centered for all videos) */}
              {currentVideoUrl && !isVideoBuffering && !videoLoadError && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <button
                    type="button"
                    onClick={togglePlayPause}
                    className={`pointer-events-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer ${
                      !isPlaying
                        ? 'opacity-100 scale-100 ring-4 ring-white/20'
                        : 'opacity-0 group-hover:opacity-100 hover:opacity-100 scale-95 hover:scale-100'
                    }`}
                    title={isPlaying ? 'Pause Video' : 'Play Video'}
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white" />
                    ) : (
                      <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white ml-1" />
                    )}
                  </button>
                </div>
              )}

              {currentVideoUrl ? (
                <video
                  ref={videoRef}
                  key={currentVideoUrl}
                  src={currentVideoUrl}
                  controls
                  controlsList="nodownload noplaybackrate"
                  disablePictureInPicture
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={togglePlayPause}
                  onError={(e) => {
                    console.error('Video error:', e);
                    setIsVideoBuffering(false);
                    setVideoLoadError('Unable to load video stream. Please check your internet connection or click Retry.');
                  }}
                  onLoadedMetadata={(e) => {
                    restoreStoppedPlayback(e.currentTarget);
                    const vid = e.currentTarget;
                    if (vid.duration && selectedVideo) {
                      creditService.saveVideoPlaybackPosition(
                        studentId,
                        `vid_${selectedVideo.id}`,
                        vid.currentTime,
                        vid.duration,
                      );
                      reloadProgress();
                    }
                  }}
                  onCanPlay={(e) => {
                    setIsVideoBuffering(false);
                    restoreStoppedPlayback(e.currentTarget);
                  }}
                  onWaiting={() => setIsVideoBuffering(true)}
                  onPlaying={() => {
                    setIsPlaying(true);
                    setIsVideoBuffering(false);
                  }}
                  onPause={(e) => {
                    setIsPlaying(false);
                    const vid = e.currentTarget;
                    creditService.saveVideoPlaybackPosition(
                      studentId,
                      `vid_${selectedVideo.id}`,
                      vid.currentTime,
                      vid.duration,
                    );
                    reloadProgress();
                  }}
                  onEnded={() => {
                    setIsPlaying(false);
                    const videoKey = `vid_${selectedVideo.id}`;
                    const currentProg = progressState[selectedVideo.id] || creditService.getVideoWatchProgress(studentId, videoKey);
                    if (!currentProg?.isCredited) {
                      handleAutoProgress(100, videoRef.current?.duration, videoRef.current?.duration);
                    }
                    creditService.saveVideoPlaybackPosition(
                      studentId,
                      videoKey,
                      0,
                      videoRef.current?.duration,
                    );
                    reloadProgress();
                  }}
                  onSeeking={(e) => {
                    const vid = e.currentTarget;
                    // Restrict seeking forward beyond what has actually been watched:
                    if (vid.currentTime > maxWatchedTimeRef.current + 1.5) {
                      vid.currentTime = maxWatchedTimeRef.current;
                      setSeekWarning('Fast-forwarding is disabled! You must watch continuously to earn credits.');
                      setTimeout(() => setSeekWarning(null), 3500);
                    }
                  }}
                  onRateChange={(e) => {
                    const vid = e.currentTarget;
                    // Lock playback speed to 1.0x normal speed:
                    if (vid.playbackRate !== 1) {
                      vid.playbackRate = 1;
                      setSeekWarning('Playback speed is locked to 1.0x normal speed.');
                      setTimeout(() => setSeekWarning(null), 3000);
                    }
                  }}
                  onTimeUpdate={(e) => {
                    const vid = e.currentTarget;
                    if (!vid.seeking && vid.currentTime > maxWatchedTimeRef.current) {
                      maxWatchedTimeRef.current = vid.currentTime;
                    }
                    if (vid.duration > 0) {
                      const currentPct = Math.round((maxWatchedTimeRef.current / vid.duration) * 100);
                      handleAutoProgress(currentPct, vid.currentTime, vid.duration);
                      // Continuously persist timestamp every 3 seconds
                      if (Math.floor(vid.currentTime) % 3 === 0) {
                        creditService.saveVideoPlaybackPosition(
                          studentId,
                          `vid_${selectedVideo.id}`,
                          vid.currentTime,
                          vid.duration,
                        );
                      }
                    }
                  }}
                />
              ) : null}
            </div>


            {/* AUTOMATED READ-ONLY WATCH TRACKER (No manual slider, No mark buttons) */}
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                        isPlaying ? 'bg-emerald-400 opacity-75' : 'bg-slate-400 opacity-20'
                      }`}
                    />
                    <span
                      className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        isPlaying ? 'bg-emerald-500' : 'bg-slate-500'
                      }`}
                    />
                  </span>
                  <span className="font-semibold text-slate-300">
                    Automated Watch Progress: <strong className="text-white text-sm">{watchPercent}%</strong>
                  </span>
                </div>

                <div>
                  {progressState[selectedVideo.id]?.isCredited ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Credits Claimed (+{creditPerVideo} pts) • One-Time Award Completed
                    </span>
                  ) : watchPercent >= requiredWatchPct ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Credits Automatically Awarded (+{creditPerVideo} pts)
                    </span>
                  ) : (
                    <span className="text-amber-400">
                      Watch until {requiredWatchPct}% to automatically unlock +{creditPerVideo} credits ({totalVideoPoolCredits} total pool)
                    </span>
                  )}
                </div>
              </div>

              {/* Strictly Read-Only Progress Bar */}
              <div className="w-full h-2.5 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    watchPercent >= requiredWatchPct
                      ? 'bg-emerald-500 shadow-md shadow-emerald-500/50'
                      : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min(watchPercent, 100)}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  Staff-configured target: <strong className="text-slate-300">{requiredWatchPct}%</strong>
                </span>
                <span>
                  {watchPercent >= requiredWatchPct
                    ? 'Goal Achieved'
                    : isPlaying
                    ? 'Tracking actual video playback in real time...'
                    : 'Press Play on the video to continue tracking'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400">{selectedVideo.desc}</p>
          </div>
        </div>
      )}
    </div>
  );
};
export default StudentTutorialsPage;
