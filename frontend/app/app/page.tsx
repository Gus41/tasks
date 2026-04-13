"use client";

import { useEffect, useRef, useState } from "react";
import { getTasks, createTask, deleteTask, updateTask } from "@/services/api";
import { Task } from "@/types/task";

const COLUMNS = [
  { key: "Pending", label: "Pending", dot: "bg-yellow-500" },
  { key: "InProgress", label: "In Progress", dot: "bg-blue-500" },
  { key: "Completed", label: "Completed", dot: "bg-green-500" },
] as const;

const NEXT_STATUS: Record<string, string> = {
  Pending: "InProgress",
  InProgress: "Completed",
};

const PRIORITY_STYLES: Record<string, string> = {
  High: "bg-red-950   text-red-400",
  Medium: "bg-yellow-950 text-yellow-500",
  Low: "bg-green-950  text-green-500",
};

type ModalState = {
  open: boolean;
  editingId: number | null;
  title: string;
  description: string;
  priority: string;
  status: string;
};

const EMPTY_MODAL: ModalState = {
  open: false, editingId: null,
  title: "", description: "",
  priority: "Medium", status: "Pending",
};

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-[#21262d] p-3" style={{ background: "#161b22" }}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="h-3 w-2/3 rounded animate-pulse bg-[#21262d]" />
        <div className="flex gap-1 shrink-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-[22px] h-[22px] rounded-md animate-pulse bg-[#21262d]" />
          ))}
        </div>
      </div>
      <div className="h-2.5 w-full rounded animate-pulse bg-[#21262d] mb-1.5" />
      <div className="h-2.5 w-3/4 rounded animate-pulse bg-[#21262d] mb-3" />
      <div className="h-[18px] w-12 rounded-full animate-pulse bg-[#21262d]" />
    </div>
  );
}

function SkeletonBoard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
      {COLUMNS.map(({ key, label, dot }) => (
        <div
          key={key}
          className="rounded-xl border border-[#21262d] overflow-hidden"
          style={{ background: "#0d1117" }}
        >
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#21262d]">
            <span className={`w-2 h-2 rounded-full ${dot}`} />
            <span className="text-xs font-medium text-[#8b949e]">{label}</span>
            <div className="ml-auto h-[18px] w-6 rounded-full animate-pulse bg-[#21262d]" />
          </div>
          <div className="p-2 flex flex-col gap-1.5">
            {Array.from({ length: key === "Pending" ? 3 : 2 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadingToast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-[#30363d] shadow-lg"
      style={{ background: "#161b22" }}>
      <svg className="w-3.5 h-3.5 animate-spin text-[#388bfd]" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <span className="text-xs text-[#8b949e]">{message}</span>
    </div>
  );
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingMessage, setSavingMessage] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(EMPTY_MODAL);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const fetchTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);
  useEffect(() => { if (modal.open) titleRef.current?.focus(); }, [modal.open]);

  const withSaving = async (message: string, fn: () => Promise<void>) => {
    setSavingMessage(message);
    try {
      await fn();
    } finally {
      setSavingMessage(null);
    }
  };

  const openCreate = () => setModal({ ...EMPTY_MODAL, open: true });

  const openEdit = (task: Task) =>
    setModal({
      open: true, editingId: task.id, title: task.title,
      description: task.description ?? "", priority: task.priority, status: task.status,
    });

  const closeModal = () => setModal(EMPTY_MODAL);

  const handleSave = async () => {
    if (!modal.title.trim()) return;
    const payload = {
      title: modal.title, description: modal.description,
      status: modal.status, priority: modal.priority,
    };
    const isEditing = !!modal.editingId;
    const editingId = modal.editingId;
    const createdAt = tasks.find(t => t.id === modal.editingId)?.createdAt ?? new Date().toISOString();
    closeModal();
    await withSaving(isEditing ? "Salvando alterações..." : "Criando tarefa...", async () => {
      if (isEditing) {
        await updateTask(editingId!, { ...payload, id: editingId!, createdAt });
      } else {
        await createTask(payload);
      }
      await fetchTasks();
    });
  };

  const handleAdvance = async (task: Task) => {
    const next = NEXT_STATUS[task.status];
    if (!next) return;
    // Optimistic update
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: next } : t));
    await withSaving("Atualizando status...", async () => {
      await updateTask(task.id, { ...task, status: next });
      await fetchTasks();
    });
  };

  const handleDelete = async (id: number) => {
    await withSaving("Excluindo tarefa...", async () => {
      await deleteTask(id);
      await fetchTasks();
    });
  };

  const handleDragStart = (taskId: number) => {
    setDragging(taskId);
  };

  const handleDragEnd = () => {
    setDragging(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    setDragOverColumn(columnKey);
  };

  const handleDrop = async (status: string) => {
    setDragOverColumn(null);
    if (dragging === null) return;
    const task = tasks.find((t) => t.id === dragging);
    setDragging(null);
    if (task && task.status !== status) {
      // Optimistic update — move instantly
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status } : t));
      await withSaving("Movendo tarefa...", async () => {
        await updateTask(task.id, { ...task, status });
        await fetchTasks();
      });
    }
  };

  return (
    <div className="relative min-h-screen p-5" style={{ background: "#161b22", fontFamily: "inherit" }}>

      {savingMessage && <LoadingToast message={savingMessage} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 16 16">
              <path d="M2 2h5v5H2zm7 0h5v5H9zM2 9h5v5H2zm7 0h5v5H9z" />
            </svg>
          </div>
          <div>
            <h1 className="text-[15px] font-medium text-[#e6edf3]">Task Manager</h1>
            <p className="text-[11px] text-[#7d8590]">
              {loading ? "Carregando..." : `${tasks.length} tarefa${tasks.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          disabled={!!savingMessage}
          className="h-8 px-4 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border-none"
        >
          <svg className="w-3 h-3 fill-white" viewBox="0 0 16 16">
            <path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z" />
          </svg>
          Nova tarefa
        </button>
      </div>

      {/* Kanban */}
      {loading ? (
        <SkeletonBoard />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
          {COLUMNS.map(({ key, label, dot }) => {
            const col = tasks.filter((t) => t.status === key);
            const isOver = dragOverColumn === key;
            const isDraggingToThis = dragging !== null && isOver;

            return (
              <div
                key={key}
                className="rounded-xl border overflow-hidden transition-all duration-150"
                style={{
                  background: isDraggingToThis ? "#111820" : "#0d1117",
                  borderColor: isDraggingToThis ? "#388bfd" : "#21262d",
                  boxShadow: isDraggingToThis ? "0 0 0 1px #388bfd33, inset 0 0 24px #388bfd0a" : "none",
                }}
                onDragOver={(e) => handleDragOver(e, key)}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={() => handleDrop(key)}
              >
                <div
                  className="flex items-center gap-2 px-3 py-2.5 border-b transition-colors duration-150"
                  style={{ borderColor: isDraggingToThis ? "#388bfd44" : "#21262d" }}
                >
                  <span className={`w-2 h-2 rounded-full transition-all duration-150 ${dot} ${isDraggingToThis ? "scale-125" : ""}`} />
                  <span className="text-xs font-medium text-[#8b949e]">{label}</span>
                  <span
                    className="ml-auto text-[11px] border rounded-full px-2 py-0.5 transition-colors duration-150"
                    style={{
                      background: isDraggingToThis ? "#1c2d3f" : "#161b22",
                      borderColor: isDraggingToThis ? "#388bfd66" : "#30363d",
                      color: isDraggingToThis ? "#388bfd" : "#8b949e",
                    }}
                  >
                    {col.length}
                  </span>
                </div>

                <div className="p-2 flex flex-col gap-1.5 min-h-[60px]">
                  {col.length === 0 && (
                    <div
                      className="flex flex-col items-center justify-center py-8 rounded-lg border border-dashed transition-all duration-150"
                      style={{
                        borderColor: isDraggingToThis ? "#388bfd55" : "#21262d",
                        background: isDraggingToThis ? "#388bfd08" : "transparent",
                      }}
                    >
                      {isDraggingToThis ? (
                        <>
                          <svg className="w-5 h-5 mb-1.5 fill-[#388bfd]" viewBox="0 0 16 16">
                            <path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z" />
                          </svg>
                          <p className="text-[11px] text-[#388bfd]">Soltar aqui</p>
                        </>
                      ) : (
                        <p className="text-[11px] text-[#484f58]">Sem tarefas</p>
                      )}
                    </div>
                  )}

                  {/* Drop indicator at top when column has cards */}
                  {isDraggingToThis && col.length > 0 && (
                    <div className="h-1 rounded-full bg-[#388bfd] opacity-60 mx-1" />
                  )}

                  {col.map((task) => {
                    const isThisBeingDragged = dragging === task.id;
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task.id)}
                        onDragEnd={handleDragEnd}
                        className="rounded-lg border p-3 transition-all duration-150"
                        style={{
                          background: isThisBeingDragged ? "#0d1117" : "#161b22",
                          borderColor: isThisBeingDragged ? "#388bfd" : "#21262d",
                          opacity: isThisBeingDragged ? 0.35 : 1,
                          transform: isThisBeingDragged ? "scale(0.97)" : "scale(1)",
                          cursor: isThisBeingDragged ? "grabbing" : "grab",
                          boxShadow: isThisBeingDragged ? "0 0 0 1px #388bfd44" : "none",
                          pointerEvents: savingMessage ? "none" : "auto",
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className="text-[13px] font-medium text-[#e6edf3] leading-snug flex-1">{task.title}</p>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => openEdit(task)} title="Editar"
                              className="w-[22px] h-[22px] border border-[#30363d] rounded-md bg-transparent flex items-center justify-center hover:bg-[#21262d] transition-colors">
                              <svg className="w-2.5 h-2.5 fill-[#8b949e]" viewBox="0 0 16 16">
                                <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354l-1.086-1.086zM11.189 6.25 9.75 4.81l-6.286 6.287a.25.25 0 0 0-.064.108l-.558 1.953 1.953-.558a.25.25 0 0 0 .108-.064l6.286-6.286z" />
                              </svg>
                            </button>
                            {NEXT_STATUS[task.status] && (
                              <button onClick={() => handleAdvance(task)} title="Avançar"
                                className="w-[22px] h-[22px] border border-[#30363d] rounded-md bg-transparent flex items-center justify-center hover:bg-[#21262d] hover:[&>svg]:fill-[#388bfd] transition-colors">
                                <svg className="w-2.5 h-2.5 fill-[#8b949e]" viewBox="0 0 16 16">
                                  <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
                                </svg>
                              </button>
                            )}
                            <button onClick={() => handleDelete(task.id)} title="Excluir"
                              className="w-[22px] h-[22px] border border-[#30363d] rounded-md bg-transparent flex items-center justify-center hover:bg-[#21262d] hover:[&>svg]:fill-[#f85149] transition-colors">
                              <svg className="w-2.5 h-2.5 fill-[#8b949e]" viewBox="0 0 16 16">
                                <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.576l-.66-6.6a.75.75 0 1 1 1.492-.149ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {task.description && (
                          <p className="text-[11px] text-[#7d8590] leading-relaxed mb-2 line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${PRIORITY_STYLES[task.priority] ?? "bg-[#21262d] text-[#8b949e]"}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div
          className="absolute inset-0 flex items-center justify-center z-50 rounded-xl"
          style={{ background: "rgba(1,4,9,.75)" }}
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="w-96 rounded-xl border border-[#30363d] p-5" style={{ background: "#161b22" }}>
            <h2 className="text-sm font-medium text-[#e6edf3] mb-4">
              {modal.editingId ? "Editar tarefa" : "Nova tarefa"}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-[#8b949e] block mb-1">Título</label>
                <input
                  ref={titleRef}
                  value={modal.title}
                  onChange={(e) => setModal((m) => ({ ...m, title: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  placeholder="Ex: Revisar PR #42"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-md text-[#e6edf3] text-sm px-3 py-2 outline-none focus:border-[#388bfd]"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#8b949e] block mb-1">Descrição</label>
                <textarea
                  value={modal.description}
                  onChange={(e) => setModal((m) => ({ ...m, description: e.target.value }))}
                  placeholder="Detalhes opcionais..."
                  rows={3}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-md text-[#e6edf3] text-sm px-3 py-2 outline-none focus:border-[#388bfd] resize-none leading-relaxed"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#8b949e] block mb-1">Prioridade</label>
                  <select
                    value={modal.priority}
                    onChange={(e) => setModal((m) => ({ ...m, priority: e.target.value }))}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-md text-[#e6edf3] text-sm px-3 py-2 outline-none focus:border-[#388bfd]"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[#8b949e] block mb-1">Status</label>
                  <select
                    value={modal.status}
                    onChange={(e) => setModal((m) => ({ ...m, status: e.target.value }))}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-md text-[#e6edf3] text-sm px-3 py-2 outline-none focus:border-[#388bfd]"
                  >
                    <option value="Pending">Pending</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={closeModal}
                className="h-8 px-4 bg-transparent border border-[#30363d] rounded-md text-[#8b949e] text-xs hover:bg-[#21262d] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="h-8 px-4 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium rounded-md border-none transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}