'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Send, AlertCircle, ClipboardList } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { projectSubmissionSchema, type ProjectSubmissionData } from './project-submission-schema'
import { recordProjectSubmission, type AssessmentAttempt } from '../../../../_shared/use-assessment-attempts'
import type { TakeableAssessment } from '../../../../_shared/assessment-data'

interface ProjectSubmissionViewProps {
  assessment: TakeableAssessment
  onSubmitted: (attempt: AssessmentAttempt) => void
}

/**
 * One-screen submission view for a PROJECT (hackathon-style) assessment —
 * brief display + a single input matching `submissionFormat` + Submit.
 * Deliberately does not reuse `QuestionNavigator`/`CountdownTimer`: a
 * project has no per-question navigation and is never timed, so routing it
 * through the quiz-taking flow would force a question-shaped UI onto
 * something that isn't one. Reuses the react-hook-form + zodResolver
 * pattern already established for /contributor/publishing/submit rather
 * than inventing a new form pattern for this one screen.
 */
export function ProjectSubmissionView({ assessment, onSubmitted }: ProjectSubmissionViewProps) {
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectSubmissionData>({ resolver: zodResolver(projectSubmissionSchema) })

  const onSubmit = async (data: ProjectSubmissionData) => {
    setSubmitting(true)
    setSubmitError('')
    try {
      if (!user) throw new Error('You must be signed in to submit a project')
      const attempt = await recordProjectSubmission(user.id, assessment.id, data.response)
      onSubmitted(attempt)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not submit your project')
    } finally {
      setSubmitting(false)
    }
  }

  const isLink = assessment.submissionFormat === 'LINK'

  return (
    <div>
      <h1 className="cinzel" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
        {assessment.title}
      </h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
          <ClipboardList size={13} /> Project Brief
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{assessment.brief}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card">
        <label htmlFor="project-response" style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
          {isLink ? 'Submission Link' : 'Your Submission'}
        </label>
        {isLink ? (
          <input
            id="project-response"
            type="url"
            placeholder="https://…"
            aria-label="Submission link"
            style={{ width: '100%', padding: 10, fontSize: 12, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none' }}
            {...register('response')}
          />
        ) : (
          <textarea
            id="project-response"
            rows={6}
            placeholder="Write your submission…"
            aria-label="Submission text"
            style={{ width: '100%', padding: 10, fontSize: 12, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }}
            {...register('response')}
          />
        )}
        {errors.response && (
          <p style={{ fontSize: 10, color: 'var(--red-light)', marginTop: 4 }}>{errors.response.message}</p>
        )}

        {submitError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--red-dim)', color: 'var(--red-light)', borderRadius: 6, padding: '8px 12px', fontSize: 11, marginTop: 12 }}>
            <AlertCircle size={13} /> {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          aria-label="Submit project"
          style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, border: 'none', background: 'var(--gold)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1 }}
        >
          <Send size={13} /> {submitting ? 'Submitting…' : 'Submit Project'}
        </button>
      </form>
    </div>
  )
}
