# Video Playback Failure — Root Cause Analysis & Plan

**Target File:** `src/app/components/BackgroundVideo/BackgroundVideoEngine.tsx`  
**Current Branch:** `redesign/services-hover-expansion-video`  
**Status:** Root Cause Identified — Awaiting Approval to Execute  
**Author:** `Fenar7 <86710532+Fenar7@users.noreply.github.com>`  

---

## 1. Executive Summary: What Broke Local Video Playback?

Following commit `eec972c` (*"Remove delayed background poster and optimize video startup"*), the background living video stopped playing entirely across localhost and production.

Investigation confirmed that the browser is receiving an immediate **HTTP 404 Not Found** on the video resource, preventing the `<video>` element from loading or playing any frames.

---

## 2. Root Cause Tracing

### The Typo in Video Source (`BackgroundVideoEngine.tsx`)
In `src/app/components/BackgroundVideo/BackgroundVideoEngine.tsx` (lines 95–105):
```tsx
<video
  ref={videoRef}
  className={styles.fixedVideoElement}
  autoPlay
  muted
  loop
  playsInline
  preload="auto"
>
  <source src="/video/video-web-faststart.mp4" type="video/mp4" />
</video>
```

### The File on Disk (`public/video/`)
In the filesystem:
```
public/video/
└── video-web.mp4 (9,692,739 bytes)
```

1. Commit `eec972c` optimized the MP4 with faststart and committed the resulting binary directly over `public/video/video-web.mp4`.
2. However, in the JSX source code, the `<source>` tag was written as:
   `src="/video/video-web-faststart.mp4"`
3. **`/video/video-web-faststart.mp4` does NOT exist in `public/video/`**.
4. When the browser attempts to stream the video, it issues:
   `GET /video/video-web-faststart.mp4 HTTP/1.1` $\to$ **`404 Not Found`**.
5. With no secondary `<source>` or fallback `src`, the HTML5 media engine immediately fires a fatal `MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED` / `404`, and playback never starts.

---

## 3. Secondary Resilience Findings

1. **No Direct `src` on `<video>` Tag:**
   When `<video>` relies solely on `<source>` tags without a primary `src="/video/video-web.mp4"` attribute on the `<video>` tag itself, some WebKit/Blink versions fail to trigger fallback mechanisms or throw silent unhandled media errors.
2. **Missing `onError` Diagnostic Handler:**
   When a 404 occurs on `<source>`, the `<video>` element emits an error event that was unhandled, causing the background to remain frozen without logging diagnostic output to the developer console.

---

## 4. Implementation Plan (Exact Fixes)

### Step 1: Correct Source Path & Provide Redundant Fallbacks
In `src/app/components/BackgroundVideo/BackgroundVideoEngine.tsx`:
```tsx
<video
  ref={videoRef}
  className={styles.fixedVideoElement}
  src="/video/video-web.mp4"
  autoPlay
  muted
  loop
  playsInline
  preload="auto"
  onError={(e) => console.error("Living Background Video failed to load:", e)}
>
  <source src="/video/video-web.mp4" type="video/mp4" />
</video>
```

### Step 2: Ensure Symlink/Alias for Zero-Downtime Resilience
Create a file copy or alias `public/video/video-web-faststart.mp4` pointing to `video-web.mp4` so that any cached browser sessions or legacy links requesting either name resolve with 200 OK.

### Step 3: Verification
- Verify `GET http://localhost:3003/video/video-web.mp4` returns `200 OK` (Content-Type: video/mp4).
- Confirm video autoplays smoothly on localhost with zero console errors.
- Run `npm run test:boundaries` to verify boundary compliance.
- Commit to branch `redesign/services-hover-expansion-video` as `Fenar7 <86710532+Fenar7@users.noreply.github.com>`.
- Update PR #99 without merging.
