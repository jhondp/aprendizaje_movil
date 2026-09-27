import { createContext, useContext } from 'react';
import type { Course } from '@/domain/course';

export const CourseContext = createContext<Course | null>(null);

export function useCourse(): Course {
  const course = useContext(CourseContext);
  if (!course) throw new Error('CourseProvider is missing above this component');
  return course;
}
