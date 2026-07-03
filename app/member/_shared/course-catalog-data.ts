import type { ComponentType } from 'react'
import {
  BookOpen, GraduationCap, Landmark, Music, Heart, Coins, HandHeart,
  Sparkles, Shield, Users, Building2, Leaf,
} from 'lucide-react'

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
  category: string
  lessons: number
  duration: string
  rating: string
  students: number
  image: ComponentType<{ size?: number; color?: string }>
  description: string
}

export const courseCatalog: CatalogCourse[] = [
  { id: '1', title: 'Kingdom Foundations', instructor: 'Dr. Elias Nkubito', category: 'Theology', lessons: 4, duration: '3h', rating: '4.8', students: 312, image: BookOpen, description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '2', title: 'Understanding Divine Purpose', instructor: 'Dr. Elias Nkubito', category: 'Personal Development', lessons: 4, duration: '4h', rating: '4.6', students: 248, image: GraduationCap, description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '3', title: 'Leadership & Governance', instructor: 'Dr. Elias Nkubito', category: 'Leadership', lessons: 4, duration: '5h', rating: '4.7', students: 189, image: Landmark, description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '4', title: 'The Art of Worship', instructor: 'Dr. Elias Nkubito', category: 'Worship', lessons: 4, duration: '3h', rating: '4.9', students: 401, image: Music, description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '5', title: 'Kingdom Marriage Principles', instructor: 'Dr. Elias Nkubito', category: 'Marriage', lessons: 4, duration: '4h', rating: '4.5', students: 156, image: Heart, description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '6', title: 'Financial Stewardship', instructor: 'Dr. Elias Nkubito', category: 'Business', lessons: 4, duration: '3h', rating: '4.4', students: 210, image: Coins, description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '7', title: 'Prayer & Meditation', instructor: 'Dr. Elias Nkubito', category: 'Theology', lessons: 4, duration: '2h', rating: '4.8', students: 275, image: HandHeart, description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '8', title: 'The Nature of God', instructor: 'Dr. Elias Nkubito', category: 'Theology', lessons: 4, duration: '5h', rating: '4.9', students: 330, image: Sparkles, description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '9', title: 'Spiritual Authority', instructor: 'Dr. Elias Nkubito', category: 'Leadership', lessons: 4, duration: '4h', rating: '4.6', students: 143, image: Shield, description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '10', title: 'Building Healthy Relationships', instructor: 'Dr. Elias Nkubito', category: 'Personal Development', lessons: 4, duration: '3h', rating: '4.5', students: 198, image: Users, description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '11', title: 'The Kingdom Economy', instructor: 'Dr. Elias Nkubito', category: 'Business', lessons: 4, duration: '6h', rating: '4.7', students: 167, image: Building2, description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
  { id: '12', title: 'Divine Health & Wellness', instructor: 'Dr. Elias Nkubito', category: 'Health', lessons: 4, duration: '4h', rating: '4.8', students: 224, image: Leaf, description: 'Comprehensive course covering key principles and practical applications for everyday life.' },
]

export const courseCategories = ['All', 'Theology', 'Leadership', 'Personal Development', 'Worship', 'Marriage', 'Business', 'Health']
