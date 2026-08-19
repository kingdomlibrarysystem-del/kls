import { ChevronLeft, ChevronRight, Send, CheckSquare, Square } from 'lucide-react'
import type { Question } from '../../../../_shared/assessment-data'

interface QuestionNavigatorProps {
  question: Question
  index: number
  total: number
  selectedOptionIndex?: number
  selectedOptionIndices?: number[]
  openAnswer?: string
  onSelectOption: (optionIndex: number) => void
  onToggleMultiOption: (optionIndex: number) => void
  onOpenAnswerChange: (value: string) => void
  onPrev: () => void
  onNext: () => void
  onSubmit: () => void
}

/** Renders one question at a time with Previous/Next navigation and a Submit action on the last question. */
export function QuestionNavigator({
  question, index, total, selectedOptionIndex, selectedOptionIndices, openAnswer,
  onSelectOption, onToggleMultiOption, onOpenAnswerChange, onPrev, onNext, onSubmit,
}: QuestionNavigatorProps) {
  const isLast = index === total - 1

  return (
    <div className="card">
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
        Question {index + 1} of {total} · {question.marks} marks
      </p>
      {question.context && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10, padding: '8px 10px', background: 'var(--bg-section)', borderRadius: 6 }}>
          {question.context}
        </p>
      )}
      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>{question.text}</p>

      {question.type === 'SINGLE_SELECT' && question.options && (
        <div role="radiogroup" aria-label={`Answer options for question ${index + 1}`} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {question.options.map((option, optionIndex) => {
            const selected = selectedOptionIndex === optionIndex
            return (
              <button
                key={option}
                role="radio"
                aria-checked={selected}
                onClick={() => onSelectOption(optionIndex)}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: `1px solid ${selected ? 'var(--gold)' : 'var(--border)'}`,
                  background: selected ? 'rgba(212,168,67,0.1)' : 'var(--bg-card)',
                  color: selected ? 'var(--gold)' : 'var(--text-secondary)',
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {option}
              </button>
            )
          })}
        </div>
      )}

      {question.type === 'MULTI_SELECT' && question.options && (
        <div role="group" aria-label={`Answer options for question ${index + 1} — select all that apply`} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {question.options.map((option, optionIndex) => {
            const selected = (selectedOptionIndices ?? []).includes(optionIndex)
            return (
              <button
                key={option}
                role="checkbox"
                aria-checked={selected}
                onClick={() => onToggleMultiOption(optionIndex)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: `1px solid ${selected ? 'var(--gold)' : 'var(--border)'}`,
                  background: selected ? 'rgba(212,168,67,0.1)' : 'var(--bg-card)',
                  color: selected ? 'var(--gold)' : 'var(--text-secondary)',
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {selected ? <CheckSquare size={16} /> : <Square size={16} />}
                {option}
              </button>
            )
          })}
        </div>
      )}

      {question.type === 'OPEN' && (
        <textarea
          rows={5}
          value={openAnswer ?? ''}
          onChange={(e) => onOpenAnswerChange(e.target.value)}
          placeholder="Write your answer…"
          aria-label={`Answer for question ${index + 1}`}
          style={{
            width: '100%', padding: 10, fontSize: 14, borderRadius: 6,
            border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)',
            outline: 'none', marginBottom: 20, resize: 'vertical',
          }}
        />
      )}

      <div className="flex items-center justify-between">
        <button onClick={onPrev} disabled={index === 0} className="btn btn-outline-dim btn-sm" aria-label="Previous question">
          <ChevronLeft size={15} /> Previous
        </button>
        {isLast ? (
          <button onClick={onSubmit} className="btn btn-gold btn-sm" aria-label="Submit assessment">
            <Send size={15} /> Submit
          </button>
        ) : (
          <button onClick={onNext} className="btn btn-gold btn-sm" aria-label="Next question">
            Next <ChevronRight size={15} />
          </button>
        )}
      </div>
    </div>
  )
}
