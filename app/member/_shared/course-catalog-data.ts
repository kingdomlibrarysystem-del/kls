/**
 * Unified, deterministic course catalog shared by Browse Courses
 * (app/member/e-learning) and My Courses (app/member/courses). Replaces two
 * previously-separate mock arrays — one of which regenerated lessons/
 * duration/rating/students via Math.random() on every render, so the same
 * course showed different numbers on every navigation. All values here are
 * fixed so a course's stats are stable across the whole member experience.
 */
export interface CatalogCourse {
  id: string
  title: string
  instructor: string
  /** References lecturerRoster in app/lecturer/_components/lecturer-identity.ts — the real learner→course→lecturer link session booking and course chat need. */
  lecturerId: string
  category: string
  lessons: number
  duration: string
  rating: string
  students: number
  /** Real Unsplash photo URL, topic-matched to the course — generic stock imagery, no identifiable individuals. */
  image: string
  description: string
}

export const courseCatalog: CatalogCourse[] = [
  { id: '1', title: 'Kingdom Foundations', instructor: 'Dr. Elias Nkubito', lecturerId: 'lec-1', category: 'Theology', lessons: 4, duration: '3h', rating: '4.8', students: 312, image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop', description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '2', title: 'Understanding Divine Purpose', instructor: 'Prof. Grace Nkomo', lecturerId: 'lec-2', category: 'Personal Development', lessons: 4, duration: '4h', rating: '4.6', students: 248, image: 'https://images.unsplash.com/photo-1447069387593-a5de0862481e?w=600&h=400&fit=crop', description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '3', title: 'Leadership & Governance', instructor: 'Dr. James Kariuki', lecturerId: 'lec-3', category: 'Leadership', lessons: 4, duration: '5h', rating: '4.7', students: 189, image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop', description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '4', title: 'The Art of Worship', instructor: 'Dr. Elias Nkubito', lecturerId: 'lec-1', category: 'Worship', lessons: 4, duration: '3h', rating: '4.9', students: 401, image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=400&fit=crop', description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '5', title: 'Kingdom Marriage Principles', instructor: 'Prof. Grace Nkomo', lecturerId: 'lec-2', category: 'Marriage', lessons: 4, duration: '4h', rating: '4.5', students: 156, image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&h=400&fit=crop', description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '6', title: 'Financial Stewardship', instructor: 'Dr. James Kariuki', lecturerId: 'lec-3', category: 'Business', lessons: 4, duration: '3h', rating: '4.4', students: 210, image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop', description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '7', title: 'Prayer & Meditation', instructor: 'Dr. Elias Nkubito', lecturerId: 'lec-1', category: 'Theology', lessons: 4, duration: '2h', rating: '4.8', students: 275, image: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=600&h=400&fit=crop', description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '8', title: 'The Nature of God', instructor: 'Prof. Grace Nkomo', lecturerId: 'lec-2', category: 'Theology', lessons: 4, duration: '5h', rating: '4.9', students: 330, image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=600&h=400&fit=crop', description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '9', title: 'Spiritual Authority', instructor: 'Dr. James Kariuki', lecturerId: 'lec-3', category: 'Leadership', lessons: 4, duration: '4h', rating: '4.6', students: 143, image: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&h=400&fit=crop', description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '10', title: 'Building Healthy Relationships', instructor: 'Dr. Elias Nkubito', lecturerId: 'lec-1', category: 'Personal Development', lessons: 4, duration: '3h', rating: '4.5', students: 198, image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop', description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '11', title: 'The Kingdom Economy', instructor: 'Prof. Grace Nkomo', lecturerId: 'lec-2', category: 'Business', lessons: 4, duration: '6h', rating: '4.7', students: 167, image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop', description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '12', title: 'Divine Health & Wellness', instructor: 'Dr. James Kariuki', lecturerId: 'lec-3', category: 'Health', lessons: 4, duration: '4h', rating: '4.8', students: 224, image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop', description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
]

export const courseCategories = ['All', 'Theology', 'Leadership', 'Personal Development', 'Worship', 'Marriage', 'Business', 'Health']
