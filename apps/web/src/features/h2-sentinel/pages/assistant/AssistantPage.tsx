import { useState } from 'react'

import {
  H2_ASSISTANT_QUESTIONS_ZH,
  type H2AssistantAnswer,
  type H2AssistantQuestionId,
  type H2AnomalyEvent,
} from '../../../../../../../packages/h2-contracts/src/index.ts'
import {
  H2_CLAIM_LABELS,
  H2_PROVENANCE_LABELS,
} from '../../model/presentation.ts'
import { PageHeader } from '../../components/common/PageHeader.tsx'
import { StatusBadge } from '../../components/common/StatusBadge.tsx'

export interface AssistantPageProps {
  readonly answer: H2AssistantAnswer | null
  readonly error: string | null
  readonly event: H2AnomalyEvent | null
  readonly onAsk: (questionId: H2AssistantQuestionId) => void
  readonly pending: boolean
}

export function AssistantPage({ answer, error, event, onAsk, pending }: AssistantPageProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<H2AssistantQuestionId>('H2Q03')
  const selectedQuestionZh =
    H2_ASSISTANT_QUESTIONS_ZH.find(({ questionId }) => questionId === selectedQuestion)
      ?.question ?? selectedQuestion

  return (
    <div className="h2-page h2-assistant-page">
      <PageHeader description="先引用结构化事件、变量和约束，再生成可读解释；外部 LLM 不是黄金路径依赖。" eyebrow="Deterministic operations assistant" title="运行助手" />

      <div className="h2-assistant-layout">
        <section aria-label="官方问题" className="h2-panel h2-question-list">
          <div className="h2-panel__heading"><div><p className="h2-eyebrow">Official questions</p><h2>十个运行问题</h2></div><StatusBadge tone="positive">离线可用</StatusBadge></div>
          <ol>
            {H2_ASSISTANT_QUESTIONS_ZH.map(({ question, questionId }, index) => (
              <li key={questionId}>
                <button
                  aria-pressed={selectedQuestion === questionId}
                  className={selectedQuestion === questionId ? 'is-active' : ''}
                  onClick={() => setSelectedQuestion(questionId)}
                  type="button"
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{question}</strong>
                </button>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="h2-answer-title" className="h2-panel h2-answer-panel">
          <div className="h2-answer-panel__prompt">
            <div><p className="h2-eyebrow">Selected question</p><h2 id="h2-answer-title">{selectedQuestionZh}</h2></div>
            <button className="h2-button h2-button--primary" disabled={pending} onClick={() => onAsk(selectedQuestion)} type="button">{pending ? '正在组装证据…' : '基于证据回答'}</button>
          </div>
          <div className="h2-answer-panel__context">
            <span>当前事件</span>
            <strong>{event ? `${event.code} · ${event.eventId}` : '未选择事件'}</strong>
          </div>
          <div aria-live="polite">
            {error ? <p className="h2-message h2-message--error">{error}</p> : null}
            {answer ? <AssistantAnswer answer={answer} /> : <div className="h2-assistant-empty"><span aria-hidden="true">◇</span><strong>等待提问</strong><p>回答将区分事实、计算、推断和建议，并引用对应证据。</p></div>}
          </div>
        </section>
      </div>

      <aside className="h2-control-boundary"><strong>控制边界</strong><p>运行助手只解释结构化结果。它不会直接控制电解槽、储能、PCC、继电器或调度设定值。</p></aside>
    </div>
  )
}

function AssistantAnswer({ answer }: { readonly answer: H2AssistantAnswer }) {
  return (
    <article className="h2-assistant-answer">
      <div className="h2-badge-row"><StatusBadge tone={answer.mode === 'DETERMINISTIC_TEMPLATE' ? 'positive' : 'planned'}>{answer.mode === 'DETERMINISTIC_TEMPLATE' ? '确定性模板' : 'LLM 渲染'}</StatusBadge><StatusBadge tone={answer.provenance.mode === 'FIXTURE' ? 'fixture' : 'live'}>{H2_PROVENANCE_LABELS[answer.provenance.mode]}</StatusBadge>{answer.refusedControlClaim ? <StatusBadge tone="danger">拒绝控制声明</StatusBadge> : null}</div>
      {answer.sections.map((section) => (
        <section key={section.sectionId}>
          <StatusBadge tone={section.claimKind === 'fact' ? 'neutral' : 'warning'}>{H2_CLAIM_LABELS[section.claimKind]}</StatusBadge>
          <p>{section.text}</p>
          <small>引用：{section.citationIds.join('、') || '无'}</small>
        </section>
      ))}
      <details><summary>查看引用来源</summary><ul>{answer.citations.map((citation) => <li key={citation.citationId}><code>{citation.citationId}</code><span>{citation.sourceType} · {citation.sourceId}</span></li>)}</ul></details>
    </article>
  )
}
