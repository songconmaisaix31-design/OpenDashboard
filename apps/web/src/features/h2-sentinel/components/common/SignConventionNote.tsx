import { H2_SIGN_CONVENTIONS } from '../../model/presentation.ts'

export interface SignConventionNoteProps {
  readonly compact?: boolean
}

/**
 * Forced official sign-convention display (T02): PCC counts positive power
 * as export and negative as import; BESS counts positive as discharge and
 * negative as charge. Rendered near charts and on diagnosis detail pages.
 */
export function SignConventionNote({ compact = false }: SignConventionNoteProps) {
  return (
    <aside
      aria-label="符号约定"
      className={compact ? 'h2-sign-convention is-compact' : 'h2-sign-convention'}
    >
      <span className="h2-sign-convention__label">符号约定</span>
      <ul>
        {H2_SIGN_CONVENTIONS.map(({ id, label, copy }) => (
          <li key={id}>
            <strong>{label}</strong>
            <span>{copy}</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
