import React, { useState } from 'react';
import { 
  ProjectTaskBoardData, 
  ProjectTaskCard, 
  ProjectTaskCategory, 
  ProjectTeamMemberColumn,
  ProjectTaskSubtask,
  createDefaultTaskBoard
} from '../../engine/masonProjectSchema';
import { useAppTheme } from '../../theme/ThemeContext';
import { 
  Kanban, 
  Plus, 
  CheckSquare, 
  Calendar, 
  User, 
  UserPlus, 
  Trash2, 
  Edit3, 
  Tag, 
  Filter, 
  Search, 
  X, 
  Clock, 
  AlertCircle, 
  Check, 
  MoreVertical,
  Layers,
  Sparkles,
  AlignLeft,
  ChevronDown
} from 'lucide-react';

interface ProjectTaskBoardProps {
  taskBoard?: ProjectTaskBoardData;
  onUpdateTaskBoard: (updated: ProjectTaskBoardData) => void;
}

export const ProjectTaskBoard: React.FC<ProjectTaskBoardProps> = ({
  taskBoard: rawTaskBoard,
  onUpdateTaskBoard
}) => {
  const taskBoard = rawTaskBoard || createDefaultTaskBoard();
  const { theme, primaryDef, bgDef } = useAppTheme();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Drag State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  // Modals state
  const [activeTaskModal, setActiveTaskModal] = useState<ProjectTaskCard | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState<boolean>(false);
  const [newTaskColumnId, setNewTaskColumnId] = useState<string | undefined>(undefined);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<ProjectTaskCategory | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#ec4899');

  const [isMemberModalOpen, setIsMemberModalOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<ProjectTeamMemberColumn | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [memberColor, setMemberColor] = useState('#3b82f6');

  // Inline Quick Add Task Title per column
  const [quickTaskTitles, setQuickTaskTitles] = useState<Record<string, string>>({});

  // Color preset options for categories & avatars
  const COLOR_PRESETS = [
    { label: 'Pink', hex: '#ec4899' },
    { label: 'Cyan', hex: '#06b6d4' },
    { label: 'Blue', hex: '#3b82f6' },
    { label: 'Amber', hex: '#f59e0b' },
    { label: 'Emerald', hex: '#10b981' },
    { label: 'Purple', hex: '#8b5cf6' },
    { label: 'Crimson', hex: '#ef4444' },
    { label: 'Teal', hex: '#14b8a6' },
    { label: 'Lime', hex: '#84cc16' },
    { label: 'Rose', hex: '#f43f5e' }
  ];

  // Helper map for categories
  const categoryMap = new Map<string, ProjectTaskCategory>();
  taskBoard.categories.forEach(c => categoryMap.set(c.id, c));

  // Filter tasks based on search & category filter
  const filteredTasks = taskBoard.tasks.filter(task => {
    const matchesSearch = searchQuery === '' || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCat = selectedCategoryFilter === 'all' || task.categoryId === selectedCategoryFilter;
    return matchesSearch && matchesCat;
  });

  // DRAG & DROP HANDLERS
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnId !== columnId) {
      setDragOverColumnId(columnId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, columnId: string) => {
    if (dragOverColumnId === columnId) {
      setDragOverColumnId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDragOverColumnId(null);
    setDraggedTaskId(null);

    if (!taskId) return;

    // Target assignee ID: 'unassigned' means Backlog / Project Tasks column
    const newAssigneeId = targetColumnId === 'unassigned' ? undefined : targetColumnId;

    const updatedTasks = taskBoard.tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          assigneeId: newAssigneeId,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });

    onUpdateTaskBoard({
      ...taskBoard,
      tasks: updatedTasks
    });
  };

  // ADD TASK
  const handleCreateQuickTask = (columnId: string) => {
    const title = (quickTaskTitles[columnId] || '').trim();
    if (!title) return;

    const newTask: ProjectTaskCard = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      description: '',
      categoryId: taskBoard.categories[0]?.id || 'cat_art',
      assigneeId: columnId === 'unassigned' ? undefined : columnId,
      priority: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onUpdateTaskBoard({
      ...taskBoard,
      tasks: [...taskBoard.tasks, newTask]
    });

    setQuickTaskTitles(prev => ({ ...prev, [columnId]: '' }));
  };

  // SAVE TASK FROM MODAL
  const handleSaveTaskModal = (taskToSave: ProjectTaskCard) => {
    const exists = taskBoard.tasks.some(t => t.id === taskToSave.id);
    let updatedTasks: ProjectTaskCard[];
    
    if (exists) {
      updatedTasks = taskBoard.tasks.map(t => t.id === taskToSave.id ? { ...taskToSave, updatedAt: new Date().toISOString() } : t);
    } else {
      updatedTasks = [...taskBoard.tasks, { ...taskToSave, updatedAt: new Date().toISOString() }];
    }

    onUpdateTaskBoard({
      ...taskBoard,
      tasks: updatedTasks
    });

    setActiveTaskModal(null);
    setIsCreatingTask(false);
  };

  // DELETE TASK
  const handleDeleteTask = (taskId: string) => {
    onUpdateTaskBoard({
      ...taskBoard,
      tasks: taskBoard.tasks.filter(t => t.id !== taskId)
    });
    setActiveTaskModal(null);
  };

  // CATEGORY MANAGERS
  const handleSaveCategory = () => {
    if (!newCatName.trim()) return;

    if (editingCategory) {
      const updated = taskBoard.categories.map(c => c.id === editingCategory.id ? { ...c, name: newCatName.trim(), color: newCatColor } : c);
      onUpdateTaskBoard({ ...taskBoard, categories: updated });
    } else {
      const newCat: ProjectTaskCategory = {
        id: `cat_${Date.now()}`,
        name: newCatName.trim(),
        color: newCatColor
      };
      onUpdateTaskBoard({ ...taskBoard, categories: [...taskBoard.categories, newCat] });
    }

    setEditingCategory(null);
    setNewCatName('');
  };

  const handleDeleteCategory = (catId: string) => {
    if (taskBoard.categories.length <= 1) return; // Keep at least 1 category
    onUpdateTaskBoard({
      ...taskBoard,
      categories: taskBoard.categories.filter(c => c.id !== catId),
      tasks: taskBoard.tasks.map(t => t.categoryId === catId ? { ...t, categoryId: taskBoard.categories.find(c => c.id !== catId)?.id } : t)
    });
  };

  // MEMBER COLUMN MANAGERS
  const handleSaveMember = () => {
    if (!memberName.trim()) return;

    if (editingMember) {
      const updated = taskBoard.members.map(m => m.id === editingMember.id ? { ...m, name: memberName.trim(), role: memberRole.trim(), avatarColor: memberColor } : m);
      onUpdateTaskBoard({ ...taskBoard, members: updated });
    } else {
      const newMember: ProjectTeamMemberColumn = {
        id: `member_${Date.now()}`,
        name: memberName.trim(),
        role: memberRole.trim() || 'Team Member',
        avatarColor: memberColor
      };
      onUpdateTaskBoard({ ...taskBoard, members: [...taskBoard.members, newMember] });
    }

    setIsMemberModalOpen(false);
    setEditingMember(null);
    setMemberName('');
    setMemberRole('');
  };

  const handleDeleteMember = (memberId: string) => {
    onUpdateTaskBoard({
      ...taskBoard,
      members: taskBoard.members.filter(m => m.id !== memberId),
      // Move unassigned or member's tasks back to Project Tasks column
      tasks: taskBoard.tasks.map(t => t.assigneeId === memberId ? { ...t, assigneeId: undefined } : t)
    });
  };

  const openNewTaskModal = (defaultColumnId?: string) => {
    const newTask: ProjectTaskCard = {
      id: `task_${Date.now()}`,
      title: '',
      description: '',
      categoryId: taskBoard.categories[0]?.id || 'cat_art',
      assigneeId: defaultColumnId === 'unassigned' ? undefined : defaultColumnId,
      priority: 'medium',
      subtasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setActiveTaskModal(newTask);
    setIsCreatingTask(true);
  };

  // Stats calculation
  const totalTasks = taskBoard.tasks.length;
  const completedTasksCount = taskBoard.tasks.filter(t => {
    if (!t.subtasks || t.subtasks.length === 0) return false;
    return t.subtasks.every(s => s.completed);
  }).length;

  return (
    <div className="space-y-4 pt-2">
      {/* SECTION HEADER & CONTROL BAR */}
      <div 
        className="rounded-3xl border p-5 md:p-6 shadow-xl transition-all"
        style={{
          backgroundColor: bgDef.cardHex,
          borderColor: bgDef.borderHex
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Title & Stats */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span 
                className="w-7 h-7 rounded-xl flex items-center justify-center border shadow-sm"
                style={{
                  backgroundColor: `rgba(${primaryDef.rgb}, 0.15)`,
                  borderColor: `rgba(${primaryDef.rgb}, 0.35)`,
                  color: primaryDef.hex
                }}
              >
                <Kanban size={16} />
              </span>
              <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                Project Task Board & Workflows
              </h2>
              <span 
                className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border"
                style={{
                  backgroundColor: bgDef.hex,
                  borderColor: bgDef.borderHex,
                  color: primaryDef.hex
                }}
              >
                {totalTasks} Cards
              </span>
            </div>
            <p className="text-xs text-neutral-400 pl-9">
              Organize project tasks, track team member assignments, and drag cards across workflow columns. Double-click any task to view full details.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div 
              className="flex items-center gap-2 border px-3 py-1.5 rounded-2xl text-xs"
              style={{
                backgroundColor: bgDef.hex,
                borderColor: bgDef.borderHex
              }}
            >
              <Search size={14} className="text-neutral-400 shrink-0" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-white placeholder-neutral-500 outline-none w-28 sm:w-36 text-xs"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-neutral-400 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div 
              className="flex items-center gap-1.5 border px-2.5 py-1.5 rounded-2xl text-xs"
              style={{
                backgroundColor: bgDef.hex,
                borderColor: bgDef.borderHex
              }}
            >
              <Filter size={13} className="text-neutral-400" />
              <select
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
                className="bg-transparent text-neutral-200 outline-none text-xs cursor-pointer"
              >
                <option value="all" className="bg-neutral-900 text-white">All Categories</option>
                {taskBoard.categories.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-neutral-900 text-white">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Manage Categories Button */}
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-3 py-1.5 rounded-2xl border text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition hover:text-white hover:border-neutral-500"
              style={{
                backgroundColor: bgDef.hex,
                borderColor: bgDef.borderHex
              }}
            >
              <Tag size={13} className="text-pink-400" />
              <span className="hidden sm:inline">Categories</span>
            </button>

            {/* Add Team Member Column Button */}
            <button
              type="button"
              onClick={() => {
                setEditingMember(null);
                setMemberName('');
                setMemberRole('');
                setMemberColor('#3b82f6');
                setIsMemberModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-2xl border text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition hover:text-white hover:border-neutral-500"
              style={{
                backgroundColor: bgDef.hex,
                borderColor: bgDef.borderHex
              }}
            >
              <UserPlus size={13} className="text-cyan-400" />
              <span>+ Member</span>
            </button>

            {/* Add Task Button */}
            <button
              type="button"
              onClick={() => openNewTaskModal('unassigned')}
              className="px-3.5 py-1.5 rounded-2xl text-white text-xs font-bold shadow-lg flex items-center gap-1.5 transition active:scale-95"
              style={{
                backgroundColor: primaryDef.hex,
                boxShadow: `0 6px 16px -4px rgba(${primaryDef.rgb}, 0.4)`
              }}
            >
              <Plus size={14} />
              <span>New Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* KANBAN BOARD COLUMNS GRID */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[700px]">
          
          {/* COLUMN 1: PROJECT TASKS (UNASSIGNED / BACKLOG) */}
          {renderColumn({
            columnId: 'unassigned',
            title: 'Project Tasks',
            subtitle: 'Unassigned backlog cards',
            icon: <CheckSquare size={16} className="text-indigo-400" />,
            badgeBgHex: `rgba(${primaryDef.rgb}, 0.15)`,
            borderColorHex: primaryDef.hex,
            tasks: filteredTasks.filter(t => !t.assigneeId || t.assigneeId === 'unassigned'),
            isFixedBacklog: true
          })}

          {/* COLUMNS 2..N: TEAM MEMBER COLUMNS */}
          {taskBoard.members.map(member => (
            renderColumn({
              columnId: member.id,
              title: member.name,
              subtitle: member.role || 'Team Member',
              memberAvatarColor: member.avatarColor || '#3b82f6',
              tasks: filteredTasks.filter(t => t.assigneeId === member.id),
              memberObj: member
            })
          ))}

          {/* ADD COLUMN QUICK BUTTON CARD */}
          <div className="w-72 shrink-0 flex flex-col items-center justify-center border border-dashed rounded-3xl p-6 transition hover:border-neutral-500 hover:bg-neutral-900/30 text-center min-h-[320px]"
            style={{ borderColor: bgDef.borderHex }}
          >
            <div 
              className="w-12 h-12 rounded-2xl border flex items-center justify-center mb-3 text-neutral-400"
              style={{ backgroundColor: bgDef.hex, borderColor: bgDef.borderHex }}
            >
              <UserPlus size={20} />
            </div>
            <h3 className="text-xs font-bold text-neutral-300 mb-1">Add Team Member Column</h3>
            <p className="text-[11px] text-neutral-500 mb-4 max-w-[200px]">
              Create a dedicated workflow lane for a person on the project team.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingMember(null);
                setMemberName('');
                setMemberRole('');
                setMemberColor('#3b82f6');
                setIsMemberModalOpen(true);
              }}
              className="px-4 py-2 rounded-2xl border text-xs font-bold text-white transition hover:scale-105 flex items-center gap-1.5"
              style={{
                backgroundColor: bgDef.hex,
                borderColor: bgDef.borderHex
              }}
            >
              <Plus size={14} />
              <span>Add Member</span>
            </button>
          </div>

        </div>
      </div>

      {/* TASK DETAIL / EDIT MODAL */}
      {activeTaskModal && (
        <TaskDetailModal
          task={activeTaskModal}
          isNew={isCreatingTask}
          categories={taskBoard.categories}
          members={taskBoard.members}
          onSave={handleSaveTaskModal}
          onDelete={handleDeleteTask}
          onClose={() => {
            setActiveTaskModal(null);
            setIsCreatingTask(false);
          }}
        />
      )}

      {/* CATEGORIES MANAGER MODAL */}
      {isCategoryModalOpen && (
        <CategoryManagerModal
          categories={taskBoard.categories}
          editingCategory={editingCategory}
          newCatName={newCatName}
          newCatColor={newCatColor}
          colorPresets={COLOR_PRESETS}
          setNewCatName={setNewCatName}
          setNewCatColor={setNewCatColor}
          setEditingCategory={setEditingCategory}
          onSaveCategory={handleSaveCategory}
          onDeleteCategory={handleDeleteCategory}
          onClose={() => {
            setIsCategoryModalOpen(false);
            setEditingCategory(null);
            setNewCatName('');
          }}
        />
      )}

      {/* MEMBER COLUMN EDIT MODAL */}
      {isMemberModalOpen && (
        <MemberColumnModal
          member={editingMember}
          memberName={memberName}
          memberRole={memberRole}
          memberColor={memberColor}
          colorPresets={COLOR_PRESETS}
          setMemberName={setMemberName}
          setMemberRole={setMemberRole}
          setMemberColor={setMemberColor}
          onSave={handleSaveMember}
          onDelete={editingMember ? () => {
            handleDeleteMember(editingMember.id);
            setIsMemberModalOpen(false);
            setEditingMember(null);
          } : undefined}
          onClose={() => {
            setIsMemberModalOpen(false);
            setEditingMember(null);
          }}
        />
      )}
    </div>
  );

  // HELPER: RENDER COLUMN
  function renderColumn({
    columnId,
    title,
    subtitle,
    icon,
    badgeBgHex,
    borderColorHex,
    memberAvatarColor,
    tasks,
    isFixedBacklog = false,
    memberObj
  }: {
    columnId: string;
    title: string;
    subtitle: string;
    icon?: React.ReactNode;
    badgeBgHex?: string;
    borderColorHex?: string;
    memberAvatarColor?: string;
    tasks: ProjectTaskCard[];
    isFixedBacklog?: boolean;
    memberObj?: ProjectTeamMemberColumn;
  }) {
    const isOver = dragOverColumnId === columnId;

    return (
      <div 
        key={columnId}
        onDragOver={e => handleDragOver(e, columnId)}
        onDragLeave={e => handleDragLeave(e, columnId)}
        onDrop={e => handleDrop(e, columnId)}
        className={`w-72 shrink-0 rounded-3xl border flex flex-col transition-all duration-200 ${
          isOver ? 'ring-2 ring-indigo-500 scale-[1.01]' : ''
        }`}
        style={{
          backgroundColor: isOver ? `rgba(${primaryDef.rgb}, 0.08)` : bgDef.cardHex,
          borderColor: isOver ? primaryDef.hex : bgDef.borderHex
        }}
      >
        {/* Column Header */}
        <div 
          className="p-4 border-b flex items-center justify-between gap-2"
          style={{ borderColor: bgDef.borderHex }}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            {memberAvatarColor ? (
              <div 
                className="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
                style={{ backgroundColor: memberAvatarColor }}
              >
                {title.charAt(0).toUpperCase()}
              </div>
            ) : (
              icon
            )}

            <div className="truncate">
              <h3 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                <span>{title}</span>
              </h3>
              <p className="text-[10px] text-neutral-400 truncate">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span 
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: bgDef.hex,
                borderColor: bgDef.borderHex,
                color: tasks.length > 0 ? (memberAvatarColor || primaryDef.hex) : '#9ca3af'
              }}
            >
              {tasks.length}
            </span>

            {!isFixedBacklog && memberObj && (
              <button
                type="button"
                onClick={() => {
                  setEditingMember(memberObj);
                  setMemberName(memberObj.name);
                  setMemberRole(memberObj.role || '');
                  setMemberColor(memberObj.avatarColor || '#3b82f6');
                  setIsMemberModalOpen(true);
                }}
                className="p-1 rounded-lg text-neutral-400 hover:text-white transition"
                title="Edit Column Details"
              >
                <Edit3 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Column Tasks Body */}
        <div className="p-3 flex-1 space-y-2.5 min-h-[220px] max-h-[500px] overflow-y-auto">
          {tasks.length === 0 ? (
            <div 
              className="h-28 border border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-4 transition"
              style={{ borderColor: bgDef.borderHex }}
            >
              <p className="text-[11px] text-neutral-500 font-medium">No tasks assigned</p>
              <p className="text-[10px] text-neutral-600">Drag cards here or add new</p>
            </div>
          ) : (
            tasks.map(task => renderTaskCard(task))
          )}
        </div>

        {/* Column Footer: Quick Inline Add Task */}
        <div 
          className="p-3 border-t space-y-2"
          style={{ borderColor: bgDef.borderHex }}
        >
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="+ Add task..."
              value={quickTaskTitles[columnId] || ''}
              onChange={e => setQuickTaskTitles({ ...quickTaskTitles, [columnId]: e.target.value })}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleCreateQuickTask(columnId);
                }
              }}
              className="flex-1 border rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-indigo-500"
              style={{
                backgroundColor: bgDef.hex,
                borderColor: bgDef.borderHex
              }}
            />
            <button
              type="button"
              onClick={() => handleCreateQuickTask(columnId)}
              className="px-2.5 py-1.5 rounded-xl border text-xs font-bold text-white transition hover:scale-105 shrink-0"
              style={{
                backgroundColor: bgDef.hex,
                borderColor: bgDef.borderHex
              }}
              title="Quick Add Task"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

      </div>
    );
  }

  // HELPER: RENDER TASK CARD
  function renderTaskCard(task: ProjectTaskCard) {
    const category = task.categoryId ? categoryMap.get(task.categoryId) : undefined;
    const catColor = category?.color || '#3b82f6';

    const totalSubtasks = task.subtasks?.length || 0;
    const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
    const isCompleted = totalSubtasks > 0 && completedSubtasks === totalSubtasks;

    const priorityColors = {
      urgent: { bg: '#ef4444', text: '#ffffff', label: 'Urgent' },
      high: { bg: '#f59e0b', text: '#ffffff', label: 'High' },
      medium: { bg: '#3b82f6', text: '#ffffff', label: 'Med' },
      low: { bg: '#6b7280', text: '#ffffff', label: 'Low' }
    };
    const prio = priorityColors[task.priority || 'medium'];

    return (
      <div
        key={task.id}
        draggable={true}
        onDragStart={e => handleDragStart(e, task.id)}
        onDoubleClick={() => setActiveTaskModal(task)}
        className="group relative rounded-2xl border p-3 shadow-md cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02] hover:border-neutral-500 hover:shadow-xl"
        style={{
          backgroundColor: bgDef.hex,
          borderColor: bgDef.borderHex
        }}
      >
        {/* Category Pill & Priority Badge */}
        <div className="flex items-center justify-between gap-2 mb-2">
          {category ? (
            <span 
              className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white flex items-center gap-1 shadow-sm truncate max-w-[150px]"
              style={{ backgroundColor: catColor }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white opacity-90 shrink-0" />
              <span className="truncate">{category.name}</span>
            </span>
          ) : (
            <span className="text-[10px] font-mono text-neutral-500">General</span>
          )}

          <span 
            className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase shrink-0"
            style={{ backgroundColor: `${prio.bg}22`, color: prio.bg, border: `1px solid ${prio.bg}44` }}
          >
            {prio.label}
          </span>
        </div>

        {/* Task Title */}
        <h4 className="text-xs font-bold text-neutral-100 leading-snug mb-1.5 group-hover:text-white transition">
          {task.title}
        </h4>

        {/* Task Description Preview */}
        {task.description && (
          <p className="text-[11px] text-neutral-400 line-clamp-2 mb-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Progress & Due Date Row */}
        <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1 font-mono">
          {totalSubtasks > 0 ? (
            <span className={`flex items-center gap-1 font-bold ${isCompleted ? 'text-emerald-400' : 'text-neutral-400'}`}>
              <CheckSquare size={11} />
              <span>{completedSubtasks}/{totalSubtasks}</span>
            </span>
          ) : (
            <span className="text-neutral-600 text-[9px]">Double-click to edit</span>
          )}

          {task.dueDate && (
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <Calendar size={11} />
              <span>{task.dueDate.slice(5)}</span>
            </span>
          )}
        </div>

        {/* Hover double-click tooltip hint */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-[9px] font-mono text-neutral-400 bg-neutral-900/90 px-1.5 py-0.5 rounded border border-neutral-700 pointer-events-none">
          Double Click
        </div>
      </div>
    );
  }
};

// ==================================================
// TASK DETAIL MODAL COMPONENT
// ==================================================
interface TaskDetailModalProps {
  task: ProjectTaskCard;
  isNew: boolean;
  categories: ProjectTaskCategory[];
  members: ProjectTeamMemberColumn[];
  onSave: (task: ProjectTaskCard) => void;
  onDelete: (taskId: string) => void;
  onClose: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isNew,
  categories,
  members,
  onSave,
  onDelete,
  onClose
}) => {
  const { bgDef, primaryDef } = useAppTheme();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [categoryId, setCategoryId] = useState(task.categoryId || categories[0]?.id || 'cat_art');
  const [assigneeId, setAssigneeId] = useState<string | undefined>(task.assigneeId);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>(task.priority || 'medium');
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [subtasks, setSubtasks] = useState<ProjectTaskSubtask[]>(task.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: ProjectTaskSubtask = {
      id: `sub_${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false
    };
    setSubtasks([...subtasks, newSub]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (subId: string) => {
    setSubtasks(subtasks.map(s => s.id === subId ? { ...s, completed: !s.completed } : s));
  };

  const handleDeleteSubtask = (subId: string) => {
    setSubtasks(subtasks.filter(s => s.id !== subId));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      ...task,
      title: title.trim(),
      description: description.trim(),
      categoryId,
      assigneeId: assigneeId === 'unassigned' ? undefined : assigneeId,
      priority,
      dueDate: dueDate || undefined,
      subtasks,
      updatedAt: new Date().toISOString()
    });
  };

  const completedCount = subtasks.filter(s => s.completed).length;
  const progressPercent = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: bgDef.cardHex,
          borderColor: bgDef.borderHex
        }}
      >
        {/* Modal Header */}
        <div 
          className="p-5 border-b flex items-center justify-between gap-3"
          style={{ borderColor: bgDef.borderHex }}
        >
          <div className="flex items-center gap-2">
            <span 
              className="w-8 h-8 rounded-xl flex items-center justify-center border text-white font-bold"
              style={{
                backgroundColor: `rgba(${primaryDef.rgb}, 0.2)`,
                borderColor: primaryDef.hex
              }}
            >
              <Kanban size={18} style={{ color: primaryDef.hex }} />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">
                {isNew ? 'Create New Project Task' : 'Task Details & Progress'}
              </h3>
              <p className="text-xs text-neutral-400">Configure title, assignee, category, and checklist items</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white border border-transparent hover:border-neutral-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-neutral-300">Task Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Sculpt Caldera Boss Arena Colliders"
              className="w-full border rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-indigo-500"
              style={{
                backgroundColor: bgDef.hex,
                borderColor: bgDef.borderHex
              }}
            />
          </div>

          {/* Grid: Category & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-neutral-300">Category Tag</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full border rounded-2xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                style={{
                  backgroundColor: bgDef.hex,
                  borderColor: bgDef.borderHex
                }}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-neutral-900 text-white">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee Column Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-neutral-300">Assignee Column</label>
              <select
                value={assigneeId || 'unassigned'}
                onChange={e => setAssigneeId(e.target.value === 'unassigned' ? undefined : e.target.value)}
                className="w-full border rounded-2xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                style={{
                  backgroundColor: bgDef.hex,
                  borderColor: bgDef.borderHex
                }}
              >
                <option value="unassigned" className="bg-neutral-900 text-white">📋 Project Tasks (Unassigned)</option>
                {members.map(m => (
                  <option key={m.id} value={m.id} className="bg-neutral-900 text-white">
                    👤 {m.name} ({m.role || 'Member'})
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Grid: Priority & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Priority Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-neutral-300">Priority Level</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full border rounded-2xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                style={{
                  backgroundColor: bgDef.hex,
                  borderColor: bgDef.borderHex
                }}
              >
                <option value="low" className="bg-neutral-900 text-white">Low Priority</option>
                <option value="medium" className="bg-neutral-900 text-white">Medium Priority</option>
                <option value="high" className="bg-neutral-900 text-white">High Priority</option>
                <option value="urgent" className="bg-neutral-900 text-white">🔥 Urgent Priority</option>
              </select>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-neutral-300">Target Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full border rounded-2xl px-3 py-2 text-xs text-white outline-none"
                style={{
                  backgroundColor: bgDef.hex,
                  borderColor: bgDef.borderHex
                }}
              />
            </div>

          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-neutral-300">Task Notes & Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add technical requirements, links to sprite assets, or implementation notes..."
              className="w-full border rounded-2xl p-3 text-xs text-white placeholder-neutral-500 outline-none resize-none"
              style={{
                backgroundColor: bgDef.hex,
                borderColor: bgDef.borderHex
              }}
            />
          </div>

          {/* Checklist Subtasks */}
          <div className="space-y-2 pt-2 border-t" style={{ borderColor: bgDef.borderHex }}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase text-neutral-300 flex items-center gap-1.5">
                <CheckSquare size={14} className="text-indigo-400" />
                <span>Checklist Subtasks</span>
              </label>
              {subtasks.length > 0 && (
                <span className="text-xs font-mono text-neutral-400 font-bold">
                  {progressPercent}% Complete ({completedCount}/{subtasks.length})
                </span>
              )}
            </div>

            {/* Progress Bar */}
            {subtasks.length > 0 && (
              <div className="w-full h-2 rounded-full overflow-hidden bg-neutral-900 border" style={{ borderColor: bgDef.borderHex }}>
                <div 
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: progressPercent === 100 ? '#10b981' : primaryDef.hex
                  }}
                />
              </div>
            )}

            {/* Subtask list */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {subtasks.map(sub => (
                <div 
                  key={sub.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl border text-xs"
                  style={{
                    backgroundColor: bgDef.hex,
                    borderColor: bgDef.borderHex
                  }}
                >
                  <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={sub.completed}
                      onChange={() => handleToggleSubtask(sub.id)}
                      className="rounded accent-indigo-500 shrink-0"
                    />
                    <span className={`truncate ${sub.completed ? 'line-through text-neutral-500' : 'text-neutral-200'}`}>
                      {sub.title}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(sub.id)}
                    className="text-neutral-500 hover:text-red-400 transition p-1"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Subtask Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="+ Add checklist item..."
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 border rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none"
                style={{
                  backgroundColor: bgDef.hex,
                  borderColor: bgDef.borderHex
                }}
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 rounded-xl border text-xs font-bold text-white transition hover:scale-105"
                style={{
                  backgroundColor: bgDef.hex,
                  borderColor: bgDef.borderHex
                }}
              >
                Add Item
              </button>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t flex items-center justify-between gap-3" style={{ borderColor: bgDef.borderHex }}>
            {!isNew ? (
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="px-3.5 py-2 rounded-2xl text-xs font-bold text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/60 transition flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Delete Task</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-2xl border text-xs font-bold text-neutral-300 hover:text-white transition"
                style={{
                  backgroundColor: bgDef.hex,
                  borderColor: bgDef.borderHex
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-2xl text-xs font-bold text-white shadow-lg transition active:scale-95"
                style={{ backgroundColor: primaryDef.hex }}
              >
                {isNew ? 'Create Task' : 'Save Changes'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

// ==================================================
// CATEGORY MANAGER MODAL COMPONENT
// ==================================================
interface CategoryManagerModalProps {
  categories: ProjectTaskCategory[];
  editingCategory: ProjectTaskCategory | null;
  newCatName: string;
  newCatColor: string;
  colorPresets: { label: string; hex: string }[];
  setNewCatName: (name: string) => void;
  setNewCatColor: (color: string) => void;
  setEditingCategory: (cat: ProjectTaskCategory | null) => void;
  onSaveCategory: () => void;
  onDeleteCategory: (id: string) => void;
  onClose: () => void;
}

const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  categories,
  editingCategory,
  newCatName,
  newCatColor,
  colorPresets,
  setNewCatName,
  setNewCatColor,
  setEditingCategory,
  onSaveCategory,
  onDeleteCategory,
  onClose
}) => {
  const { bgDef, primaryDef } = useAppTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: bgDef.cardHex,
          borderColor: bgDef.borderHex
        }}
      >
        <div 
          className="p-5 border-b flex items-center justify-between"
          style={{ borderColor: bgDef.borderHex }}
        >
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-pink-400" />
            <h3 className="text-base font-bold text-white">Manage Task Categories</h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Add / Edit Category Form */}
          <div className="p-4 rounded-2xl border space-y-3" style={{ backgroundColor: bgDef.hex, borderColor: bgDef.borderHex }}>
            <h4 className="text-xs font-bold uppercase text-neutral-300">
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </h4>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="Category Name (e.g. Boss Mechanics)"
                className="flex-1 border rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none"
                style={{
                  backgroundColor: bgDef.cardHex,
                  borderColor: bgDef.borderHex
                }}
              />
              <button
                type="button"
                onClick={onSaveCategory}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white shrink-0"
                style={{ backgroundColor: primaryDef.hex }}
              >
                {editingCategory ? 'Update' : 'Add'}
              </button>
            </div>

            {/* Color Swatch Picker */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-neutral-400">Badge Color</label>
              <div className="flex flex-wrap items-center gap-2">
                {colorPresets.map(preset => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setNewCatColor(preset.hex)}
                    className={`w-6 h-6 rounded-lg border transition flex items-center justify-center ${
                      newCatColor === preset.hex ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: preset.hex, borderColor: preset.hex }}
                    title={preset.label}
                  >
                    {newCatColor === preset.hex && <Check size={12} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* List of Existing Categories */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-neutral-400">Existing Categories</h4>
            <div className="space-y-2">
              {categories.map(cat => (
                <div 
                  key={cat.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl border text-xs"
                  style={{
                    backgroundColor: bgDef.hex,
                    borderColor: bgDef.borderHex
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="font-bold text-white">{cat.name}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(cat);
                        setNewCatName(cat.name);
                        setNewCatColor(cat.color);
                      }}
                      className="p-1 rounded-lg text-neutral-400 hover:text-white"
                      title="Edit Category"
                    >
                      <Edit3 size={13} />
                    </button>

                    {categories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteCategory(cat.id)}
                        className="p-1 rounded-lg text-neutral-400 hover:text-red-400"
                        title="Delete Category"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================================================
// MEMBER COLUMN MODAL COMPONENT
// ==================================================
interface MemberColumnModalProps {
  member: ProjectTeamMemberColumn | null;
  memberName: string;
  memberRole: string;
  memberColor: string;
  colorPresets: { label: string; hex: string }[];
  setMemberName: (name: string) => void;
  setMemberRole: (role: string) => void;
  setMemberColor: (color: string) => void;
  onSave: () => void;
  onDelete?: () => void;
  onClose: () => void;
}

const MemberColumnModal: React.FC<MemberColumnModalProps> = ({
  member,
  memberName,
  memberRole,
  memberColor,
  colorPresets,
  setMemberName,
  setMemberRole,
  setMemberColor,
  onSave,
  onDelete,
  onClose
}) => {
  const { bgDef, primaryDef } = useAppTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: bgDef.cardHex,
          borderColor: bgDef.borderHex
        }}
      >
        <div 
          className="p-5 border-b flex items-center justify-between"
          style={{ borderColor: bgDef.borderHex }}
        >
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              {member ? 'Edit Team Member Column' : 'Add Team Member Column'}
            </h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-neutral-300">Person Name *</label>
            <input
              type="text"
              required
              value={memberName}
              onChange={e => setMemberName(e.target.value)}
              placeholder="e.g. Sam Rivers"
              className="w-full border rounded-2xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 outline-none"
              style={{
                backgroundColor: bgDef.hex,
                borderColor: bgDef.borderHex
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-neutral-300">Project Role</label>
            <input
              type="text"
              value={memberRole}
              onChange={e => setMemberRole(e.target.value)}
              placeholder="e.g. Audio Composer & Sound FX"
              className="w-full border rounded-2xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 outline-none"
              style={{
                backgroundColor: bgDef.hex,
                borderColor: bgDef.borderHex
              }}
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-neutral-300">Avatar Circle Accent</label>
            <div className="flex flex-wrap items-center gap-2">
              {colorPresets.map(preset => (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => setMemberColor(preset.hex)}
                  className={`w-7 h-7 rounded-xl border transition flex items-center justify-center ${
                    memberColor === preset.hex ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: preset.hex, borderColor: preset.hex }}
                  title={preset.label}
                >
                  {memberColor === preset.hex && <Check size={12} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t flex items-center justify-between gap-3" style={{ borderColor: bgDef.borderHex }}>
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="px-3.5 py-2 rounded-2xl text-xs font-bold text-red-400 hover:text-red-300 border border-red-500/30 transition flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Remove Column</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-2xl border text-xs font-bold text-neutral-300 hover:text-white"
                style={{
                  backgroundColor: bgDef.hex,
                  borderColor: bgDef.borderHex
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                className="px-5 py-2 rounded-2xl text-xs font-bold text-white shadow-lg transition active:scale-95"
                style={{ backgroundColor: primaryDef.hex }}
              >
                {member ? 'Save Changes' : 'Add Column'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
