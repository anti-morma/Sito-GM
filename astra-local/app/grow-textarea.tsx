'use client';

import { useEffect } from 'react';

/**
 * The form's message field starts as one line on its rule, like the others,
 * and grows with what is written, up to its CSS max-height, then scrolls.
 * Kept beside the form (the form itself is the shared template's file).
 */
export default function GrowTextarea({ selector }: { selector: string }) {
  useEffect(() => {
    const fit = (field: HTMLTextAreaElement) => {
      field.style.height = '';
      field.style.overflowY = '';
      const max = parseFloat(getComputedStyle(field).maxHeight) || Infinity;
      if (field.scrollHeight <= field.clientHeight) return;
      const border = field.offsetHeight - field.clientHeight;
      const height = Math.min(max, field.scrollHeight + border);
      field.style.height = `${height}px`;
      field.style.overflowY = field.scrollHeight + border > max ? 'auto' : '';
    };
    const fitAll = () => document.querySelectorAll<HTMLTextAreaElement>(selector).forEach(fit);
    const onInput = (event: Event) => {
      if (event.target instanceof HTMLTextAreaElement && event.target.matches(selector)) fit(event.target);
    };
    document.addEventListener('input', onInput);
    addEventListener('resize', fitAll);
    fitAll();
    return () => {
      document.removeEventListener('input', onInput);
      removeEventListener('resize', fitAll);
    };
  }, [selector]);
  return null;
}
