import confetti from 'canvas-confetti';

export function fireCelebrationConfetti() {
  try {
    // Elegant emerald & gold celebration burst
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#10b981', '#059669', '#34d399', '#fbbf24', '#f59e0b', '#38bdf8'],
      disableForReducedMotion: true,
    });
  } catch {
    // ignore
  }
}

export function fireBigCelebration() {
  try {
    const end = Date.now() + 600;
    const colors = ['#10b981', '#34d399', '#fbbf24', '#38bdf8'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  } catch {
    // ignore
  }
}
