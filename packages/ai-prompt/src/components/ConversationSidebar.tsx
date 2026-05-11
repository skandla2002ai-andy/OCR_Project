import type { Conversation } from '@/types';

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
}: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">대화 목록</span>
        <button type="button" className="icon-btn" onClick={onCreate} title="새 대화">
          ＋
        </button>
      </div>

      <ul className="conv-list">
        {conversations.map((conv) => (
          <li
            key={conv.id}
            className={`conv-item ${conv.id === activeId ? 'active' : ''}`}
            onClick={() => onSelect(conv.id)}
          >
            <span className="conv-title">{conv.title}</span>
            <button
              type="button"
              className="conv-delete"
              title="삭제"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conv.id);
              }}
            >
              ✕
            </button>
          </li>
        ))}

        {!conversations.length && <li className="conv-empty">대화가 없습니다</li>}
      </ul>
    </aside>
  );
}
