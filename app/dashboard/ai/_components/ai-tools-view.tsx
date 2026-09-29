'use client'

import { SmartSearchPanel } from './smart-search-panel'
import { AiChatPanel } from './ai-chat-panel'

/** Two-column layout: mocked smart search on the left, mocked chat assistant on the right. */
export function AiToolsView() {

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SmartSearchPanel />
      <AiChatPanel />
    </div>
  )
}
