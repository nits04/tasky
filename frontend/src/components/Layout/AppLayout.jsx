import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import TaskModal from '../Task/TaskModal';
import { useTasks } from '../../hooks/useTasks';
import toast from 'react-hot-toast';

export default function AppLayout() {
  const navigate = useNavigate();
  const [showNewTask, setShowNewTask] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { createTask } = useTasks();

  const handleCreateTask = async (data) => {
    try {
      const task = await createTask(data);
      toast.success('Task created!');
      setShowNewTask(false);
      return task;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
      throw err;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar onNewTask={() => setShowNewTask(true)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onSearch={setSearchQuery}
          onNewTask={() => setShowNewTask(true)}
        />
        <main className="flex-1 overflow-auto p-6">
          <Outlet context={{ searchQuery }} />
        </main>
      </div>

      {showNewTask && (
        <TaskModal
          mode="create"
          onClose={() => setShowNewTask(false)}
          onSave={handleCreateTask}
        />
      )}
    </div>
  );
}
