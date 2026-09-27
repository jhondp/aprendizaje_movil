import type { ReactNode } from 'react';
import { CourseContext } from './useCourse';
import type { Course } from '@/domain/course';

export function CourseProvider({ value, children }: { value: Course; children: ReactNode }) {
  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}
