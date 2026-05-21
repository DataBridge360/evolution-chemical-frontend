'use client';

export function WelcomeOverlay({ text }: { text: string }) {
  const words = text.split(' ');

  return (
    <div className="welcome-overlay pointer-events-none absolute inset-0 z-[60] bg-white">
      <div className="flex h-full w-full items-center justify-center px-8">
        <h1 className="welcome-text text-center text-5xl font-bold tracking-[-0.03em] text-neutral-950 sm:text-6xl lg:text-7xl">
          {words.map((word, index) => (
            <span key={`${word}-${index}`} className="welcome-word">
              <span style={{ animationDelay: `${index * 90}ms` }}>{word}</span>
            </span>
          ))}
        </h1>
      </div>

      <style jsx>{`
        .welcome-overlay {
          filter: blur(0);
          transform: scale(1);
          transform-origin: center;
          animation: welcome-overlay-out 0.42s cubic-bezier(0.16, 1, 0.3, 1) 1.85s forwards;
        }

        .welcome-text {
          font-family:
            var(--font-geist-sans),
            -apple-system,
            BlinkMacSystemFont,
            sans-serif;
        }

        .welcome-word {
          display: inline-block;
          overflow: hidden;
          vertical-align: bottom;
          line-height: 1;
          margin-right: 0.25em;
        }

        .welcome-word span {
          display: inline-block;
          transform: translateY(105%);
          animation: welcome-word-in 0.68s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes welcome-word-in {
          to {
            transform: translateY(0);
          }
        }

        @keyframes welcome-overlay-out {
          to {
            opacity: 0;
            filter: blur(18px);
            transform: scale(1.035);
          }
        }
      `}</style>
    </div>
  );
}
