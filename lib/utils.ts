// lib/utils.ts — Shared utility functions
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate 2D distance between two points.
 */
export function distance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Calculate spatial audio volume based on distance.
 * Returns a value 0–1.
 * @param dist - Distance in pixels
 * @param maxDist - Maximum audible distance (default 200px)
 */
export function spatialVolume(dist: number, maxDist = 200): number {
  if (dist >= maxDist) return 0;
  if (dist <= 0) return 1;
  // Inverse square law approximation
  return Math.pow(1 - dist / maxDist, 2);
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): T {
  let timeout: NodeJS.Timeout;
  return ((...args: unknown[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  }) as T;
}

/**
 * Throttle a function call.
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number
): T {
  let lastCall = 0;
  return ((...args: unknown[]) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  }) as T;
}

/**
 * Linear interpolation.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
