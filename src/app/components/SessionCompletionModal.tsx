import { useEffect, useRef, useState } from "react";
import { Check, ChevronRight, X } from "lucide-react";

interface SessionCompletionModalProps {
  open: boolean;
  sessionLabel: string;
  confirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function SessionCompletionModal({
  open,
  sessionLabel,
  confirming = false,
  onCancel,
  onConfirm,
}: SessionCompletionModalProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!open) {
      setDragging(false);
      setOffset(0);
      setConfirmed(false);
    }
  }, [open]);

  if (!open) return null;

  const getPosition = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const handleSize = 52;
    const max = Math.max(0, track.clientWidth - handleSize - 8);
    return Math.min(max, Math.max(0, clientX - track.getBoundingClientRect().left - handleSize / 2));
  };

  const finishDrag = () => {
    setDragging(false);
    const track = trackRef.current;
    const max = track ? Math.max(0, track.clientWidth - 60) : 0;
    if (offset >= max * 0.82) {
      setOffset(max);
      setConfirmed(true);
      window.setTimeout(onConfirm, 220);
    } else {
      setOffset(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C1810]/35 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="completion-title">
      <div className="w-full max-w-md rounded-3xl border border-[#D4A843]/30 bg-[#F7F3EE] p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#4A1C5C] text-[#D4A843]">
              <Check className="h-5 w-5" />
            </div>
            <h2 id="completion-title" className="text-xl font-semibold text-[#4A1C5C]" style={{ fontFamily: "Playfair Display, serif" }}>
              Ready to complete {sessionLabel}?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#6B625D]">
              Once you complete the session, the board will be saved and marked as complete.
            </p>
          </div>
          <button type="button" onClick={onCancel} disabled={confirming} aria-label="Close confirmation" className="rounded-full p-2 text-[#6B625D] hover:bg-[#EBE2D6] disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div ref={trackRef} className="relative h-16 overflow-hidden rounded-2xl border border-[#4A1C5C]/15 bg-[#EBE2D6] p-1.5 select-none touch-none" onPointerMove={(event) => dragging && setOffset(getPosition(event.clientX))} onPointerUp={finishDrag} onPointerCancel={() => { setDragging(false); setOffset(0); }}>
          <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-[#4A1C5C]/65">
            {confirmed ? "Session ready to complete" : "Slide to end session"}
          </div>
          <div role="slider" tabIndex={confirming ? -1 : 0} aria-label="Slide to end session" aria-valuemin={0} aria-valuemax={100} aria-valuenow={confirmed ? 100 : 0} className="absolute left-1.5 top-1.5 flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-[#D4A843] text-[#4A1C5C] shadow-md transition-transform duration-75 focus:outline-none focus:ring-2 focus:ring-[#4A1C5C] focus:ring-offset-2" style={{ transform: `translateX(${offset}px)` }} onKeyDown={(event) => { if (!confirming && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); setOffset(100); setConfirmed(true); window.setTimeout(onConfirm, 220); } }} onPointerDown={(event) => { if (!confirming) { event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); } }}>
            {confirmed ? <Check className="h-5 w-5" /> : <ChevronRight className="h-6 w-6" />}
          </div>
        </div>

        <button type="button" onClick={onCancel} disabled={confirming} className="mt-4 w-full rounded-xl border border-[#4A1C5C]/20 px-4 py-3 text-sm font-semibold text-[#4A1C5C] hover:bg-white disabled:opacity-50">
          Cancel
        </button>
      </div>
    </div>
  );
}
