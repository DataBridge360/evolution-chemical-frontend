'use client';

import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface MaskedSlideRevealProps {
  text: string;
  staggerDelay?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  startDelayFrames?: number;
  className?: string;
}

export function MaskedSlideReveal({
  text,
  staggerDelay = 3,
  fontSize = 72,
  color = '#171717',
  fontWeight = 700,
  speed = 1,
  startDelayFrames = 0,
  className,
}: MaskedSlideRevealProps) {
  const frame = useCurrentFrame() * speed - startDelayFrames;
  const { fps } = useVideoConfig();

  const words = text.split(' ');

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'white',
      }}
    >
      <span
        className={className}
        style={{
          fontSize,
          fontWeight,
          color,
          letterSpacing: '-0.03em',
          fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        {words.map((word, i) => {
          const t = spring({
            frame: Math.max(0, frame - i * staggerDelay),
            fps,
            config: { damping: 14 },
          });

          return (
            <span
              key={`${word}-${i}`}
              style={{
                display: 'inline-block',
                overflow: 'hidden',
                verticalAlign: 'bottom',
                lineHeight: 1,
                marginRight: '0.25em',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  transform: `translateY(${(1 - t) * 100}%)`,
                }}
              >
                {word}
              </span>
            </span>
          );
        })}
      </span>
    </div>
  );
}
