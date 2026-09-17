export interface SemesterOption {
  value: number;
  label: string;
  short: string;
}

export const SEMESTERS: SemesterOption[] = [
  { value: 1, label: 'Semester 1 (1st Semester)', short: '1st Semester' },
  { value: 2, label: 'Semester 2 (2nd Semester)', short: '2nd Semester' },
  { value: 3, label: 'Semester 3 (3rd Semester)', short: '3rd Semester' },
  { value: 4, label: 'Semester 4 (4th Semester)', short: '4th Semester' },
  { value: 5, label: 'Semester 5 (5th Semester)', short: '5th Semester' },
  { value: 6, label: 'Semester 6 (6th Semester)', short: '6th Semester' },
  { value: 7, label: 'Semester 7 (7th Semester)', short: '7th Semester' },
  { value: 8, label: 'Semester 8 (8th Semester)', short: '8th Semester' },
];

export function parseSemester(val: number | string | undefined | null): number {
  if (val === undefined || val === null || val === '') return 6;
  if (typeof val === 'number') {
    if (val >= 1 && val <= 8) return val;
    return 6;
  }
  const str = String(val).toLowerCase();
  const match = str.match(/([1-8])/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 6;
}

export function formatSemesterLabel(val: number | string | undefined | null): string {
  const num = parseSemester(val);
  const found = SEMESTERS.find((s) => s.value === num);
  return found ? found.short : `Semester ${num}`;
}

export function isSameSemester(
  semA: number | string | undefined | null,
  semB: number | string | undefined | null
): boolean {
  return parseSemester(semA) === parseSemester(semB);
}
