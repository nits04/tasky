import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import TaskCard from '../Task/TaskCard';
import { KANBAN_COLUMNS } from '../../utils/helpers';

const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
};

export default function KanbanBoard({ tasks, onUpdate, onDelete, onTaskClick }) {
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const getTasksByStatus = useCallback(
    (status) =>
      tasks
        .filter((t) => t.status === status)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [tasks]
  );

  const handleDragStart = ({ active }) => {
    const task = tasks.find((t) => t._id === active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = ({ active, over }) => {
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeTask = tasks.find((t) => t._id === activeId);
    if (!activeTask) return;

    // Dropped over a column directly
    const isColumn = KANBAN_COLUMNS.some((c) => c.id === overId);
    if (isColumn && activeTask.status !== overId) {
      onUpdate(activeId, { status: overId, position: 9999 });
    }
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeTask = tasks.find((t) => t._id === activeId);
    const overTask = tasks.find((t) => t._id === overId);

    if (!activeTask) return;

    const targetStatus = overTask ? overTask.status : KANBAN_COLUMNS.find((c) => c.id === overId)?.id;
    if (!targetStatus) return;

    const targetTasks = tasks
      .filter((t) => t.status === targetStatus)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    if (activeTask.status === targetStatus && overId !== targetStatus) {
      const oldIndex = targetTasks.findIndex((t) => t._id === activeId);
      const newIndex = targetTasks.findIndex((t) => t._id === overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(targetTasks, oldIndex, newIndex);
      const updates = reordered.map((t, i) => ({ id: t._id, status: targetStatus, position: i }));
      onUpdate(null, null, updates);
    } else if (activeTask.status !== targetStatus) {
      const updates = [{ id: activeId, status: targetStatus, position: targetTasks.length }];
      onUpdate(null, null, updates);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-220px)]">
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={getTasksByStatus(col.id)}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeTask ? (
          <div className="rotate-2 opacity-95 shadow-2xl">
            <TaskCard task={activeTask} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
