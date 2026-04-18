import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableTaskCard from '../Task/SortableTaskCard';
import { STATUS_CONFIG } from '../../utils/helpers';

export default function KanbanColumn({ column, tasks, onUpdate, onDelete, onTaskClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const config = STATUS_CONFIG[column.id];

  return (
    <div className="flex-shrink-0 w-72 flex flex-col">
      {/* Header */}
      <div className={`flex items-center justify-between mb-3 px-1`}>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${config.color}`}>
            <span className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-').split(' ')[0]}`} />
            {column.label}
          </span>
          <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-medium px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Column drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-xl p-2 transition-colors min-h-24 ${
          isOver
            ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-400/50'
            : 'bg-gray-100/60 dark:bg-gray-900/40'
        }`}
      >
        <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.map((task) => (
              <SortableTaskCard
                key={task._id}
                task={task}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onTaskClick={onTaskClick}
              />
            ))}
          </div>
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-600">
            <svg className="w-8 h-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-xs">{column.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
