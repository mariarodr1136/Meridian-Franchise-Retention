const PHOTOS = ["/staff-1.jpg", "/staff-2.jpg", "/staff-3.jpg", "/staff-4.jpg"];

/**
 * Assigns headshot photos to a list of staff names deterministically.
 * Names are sorted alphabetically first so the assignment is stable across renders.
 * The first 4 unique names within a studio always get different photos.
 */
export function assignStaffPhotos(names: string[]): Map<string, string> {
  const sorted = [...new Set(names)].sort();
  const map = new Map<string, string>();
  sorted.forEach((name, idx) => {
    map.set(name, PHOTOS[idx % PHOTOS.length]);
  });
  return map;
}
