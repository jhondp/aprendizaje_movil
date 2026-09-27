import { createContext, useContext, type ReactNode } from 'react';
import type { Course } from '@/domain/course';

const CourseContext = createContext<Course | null>(null);

export function CourseProvider({ value, children }: { value: Course; children: ReactNode }) {
  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}

export function useCourse(): Course {
  const course = useContext(CourseContext);
  if (!course) throw new Error('CourseProvider is missing above this component');
  return course;
}
