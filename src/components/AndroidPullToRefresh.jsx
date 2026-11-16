import { useCallback, useRef, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import "../css/AndroidPullToRefresh.css";

const TRIGGER_DISTANCE = 84;
const MAX_PULL_DISTANCE = 112;

export default function AndroidPullToRefresh({ children, refreshKey, onRefresh }) {
  const startY = useRef(0);
  const pulling = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshBlocked, setRefreshBlocked] = useState(false);

  const isAtTop = useCallback(() => {
    const content = document.querySelector(".android-page-content");
    return (content?.scrollTop || window.scrollY || 0) <= 0;
  }, []);

  const handleTouchStart = useCallback((event) => {
    if (refreshing || event.touches.length !== 1 || !isAtTop()) return;
    setRefreshBlocked(false);
    const target = event.target;
    if (target?.closest?.("input, textarea, select, button, a, [contenteditable='true'], [data-disable-pull-refresh='true']")) return;
    startY.current = event.touches[0].clientY;
    pulling.current = true;
  }, [isAtTop, refreshing]);

  const handleTouchMove = useCallback((event) => {
    if (!pulling.current || refreshing || event.touches.length !== 1) return;
    const delta = event.touches[0].clientY - startY.current;
    if (delta <= 0) {
      setPullDistance(0);
      return;
    }
    if (!isAtTop()) {
      pulling.current = false;
      setPullDistance(0);
      return;
    }
    const distance = Math.min(MAX_PULL_DISTANCE, delta * 0.62);
    setPullDistance(distance);
    if (distance > 8 && event.cancelable) event.preventDefault();
  }, [isAtTop, refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDistance >= TRIGGER_DISTANCE && !refreshing) {
      setRefreshing(true);
      setPullDistance(TRIGGER_DISTANCE);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [onRefresh, pullDistance, refreshing]);

  return (
    <div className="android-pull-refresh" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onTouchCancel={handleTouchEnd}>
      <div className={`android-pull-refresh-indicator ${refreshing ? "is-refreshing" : ""} ${pullDistance > 0 ? "is-visible" : ""}`} style={{ height: refreshing ? 48 : Math.min(48, pullDistance * 0.55), opacity: refreshing ? 1 : Math.min(1, pullDistance / TRIGGER_DISTANCE) }} aria-live="polite">
        <FiRefreshCw />
        <span>{refreshBlocked ? "Save or discard changes before refreshing" : refreshing ? "Refreshing…" : pullDistance >= TRIGGER_DISTANCE ? "Release to refresh" : "Pull to refresh"}</span>
      </div>
      <div key={refreshKey} className="android-pull-refresh-content">{children}</div>
    </div>
  );
}
