'use client';
import { useState } from 'react';
import { motion } from 'motion/react';

export function CopyBox({ text, light = false, label = 'Copy' }: { text: string; light?: boolean; label?: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); } catch {
      const t = Object.assign(document.createElement('textarea'), { value: text });
      document.body.append(t); t.select(); document.execCommand('copy'); t.remove();
    }
    setDone(true); setTimeout(() => setDone(false), 1600);
  };
  return (
    <div className={`copy ${light ? 'light' : ''}`}>
      <code>{text}</code>
      <motion.button whileTap={{ scale: 0.92 }} onClick={copy}>{done ? 'Copied' : label}</motion.button>
    </div>
  );
}
