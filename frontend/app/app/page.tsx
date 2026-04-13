"use client";

import { useEffect, useRef, useState } from "react";
import { getTasks, createTask, deleteTask, updateTask } from "@/services/api";
import { Task } from "@/types/task";

const COLUMNS = [
  { key: "Pending",    label: "Pending",     dot: "bg-yellow-500" },
  { key: "InProgress", label: "In Progress", dot: "bg-blue-500"   },
  { key: "Completed",  label: "Completed",   dot: "bg-green-500"  },
] as const;

const NEXT_STATUS: Record<string, string> = {
  Pending: "InProgress",
  InProgress: "Completed",
};

const PRIORITY_STYLES: Record<string, string> = {
  High:   "bg-red-950   text-red-400",
  Medium: "bg-yellow-950 text-yellow-500",
  Low:    "bg-green-950  text-green-500",
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

export default function Home() {
  const [tasks, setTasks]   = useState<Task[]>([]);
  const [modal, setModal]   = useState<ModalState>(EMPTY_MODAL);
  const [dragging, setDragging] = useState<number | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const fetchTasks = async () => setTasks(await getTasks());
  useEffect(() => { fetchTasks(); }, []);
  useEffect(() => { if (modal.open) titleRef.current?.focus(); }, [modal.open]);

  const openCreate = () =>
    setModal({ ...EMPTY_MODAL, open: true });

  const openEdit = (task: Task) =>
    setModal({ open: true, editingId: task.id, title: task.title,
      description: task.description ?? "", priority: task.priority, status: task.status });

  const closeModal = () => setModal(EMPTY_MODAL);

  const handleSave = async () => {
    if (!modal.title.trim()) return;
    const payload = { id: 1, title: modal.title, description: modal.description,
      status: modal.status, priority: modal.priority };
    if (modal.editingId) await updateTask(modal.editingId, { ...payload, id: modal.editingId, createdAt: tasks.find(t => t.id === modal.editingId)?.createdAt ?? new Date().toISOString() });
    else await createTask(payload);
    closeModal();
    fetchTasks();
  };

  const handleAdvance = async (task: Task) => {
    const next = NEXT_STATUS[task.status];
    if (!next) return;
    await updateTask(task.id, { ...task, status: next });
    fetchTasks();
  };

  const handleDelete = async (id: number) => {
    await deleteTask(id);
    fetchTasks();
  };

  const handleDrop = async (status: string) => {
    if (dragging === null) return;
    const task = tasks.find((t) => t.id === dragging);
    if (task && task.status !== status) {
      await updateTask(task.id, { ...task, status });
      fetchTasks();
    }
    setDragging(null);
  };

  return (
    <div className="relative min-h-screen p-5" style={{ background: "#161b22", fontFamily: "inherit" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 16 16">
              <path d="M2 2h5v5H2zm7 0h5v5H9zM2 9h5v5H2zm7 0h5v5H9z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-[15px] font-medium text-[#e6edf3]">Task Manager</h1>
            <p className="text-[11px] text-[#7d8590]">{tasks.length} tarefa{tasks.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="h-8 px-4 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border-none"
        >
          <svg className="w-3 h-3 fill-white" viewBox="0 0 16 16">
            <path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z"/>
          </svg>
          Nova tarefa
        </button>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
        {COLUMNS.map(({ key, label, dot }) => {
          const col = tasks.filter((t) => t.status === key);
          return (
            <div
              key={key}
              className="rounded-xl border border-[#21262d] overflow-hidden"
              style={{ background: "#0d1117" }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(key)}
            >
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#21262d]">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                <span className="text-xs font-medium text-[#8b949e]">{label}</span>
                <span className="ml-auto text-[11px] border border-[#30363d] rounded-full px-2 py-0.5 text-[#8b949e]"
                  style={{ background: "#161b22" }}>
                  {col.length}
                </span>
              </div>

              <div className="p-2 flex flex-col gap-1.5 min-h-[60px]">
                {col.length === 0 && (
                  <p className="text-[11px] text-[#484f58] text-center py-5">Sem tarefas</p>
                )}
                {col.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDragging(task.id)}
                    onDragEnd={() => setDragging(null)}
                    className={`rounded-lg border border-[#21262d] p-3 cursor-grab transition-colors hover:border-[#388bfd] hover:bg-[#1c2128] ${dragging === task.id ? "opacity-40" : ""}`}
                    style={{ background: "#161b22" }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-[13px] font-medium text-[#e6edf3] leading-snug flex-1">{task.title}</p>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => openEdit(task)} title="Editar"
                          className="w-[22px] h-[22px] border border-[#30363d] rounded-md bg-transparent flex items-center justify-center hover:bg-[#21262d] transition-colors">
                          <svg className="w-2.5 h-2.5 fill-[#8b949e]" viewBox="0 0 16 16">
                            <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354l-1.086-1.086zM11.189 6.25 9.75 4.81l-6.286 6.287a.25.25 0 0 0-.064.108l-.558 1.953 1.953-.558a.25.25 0 0 0 .108-.064l6.286-6.286z"/>
                          </svg>
                        </button>
                        {NEXT_STATUS[task.status] && (
                          <button onClick={() => handleAdvance(task)} title="Avançar"
                            className="w-[22px] h-[22px] border border-[#30363d] rounded-md bg-transparent flex items-center justify-center hover:bg-[#21262d] hover:[&>svg]:fill-[#388bfd] transition-colors">
                            <svg className="w-2.5 h-2.5 fill-[#8b949e]" viewBox="0 0 16 16">
                              <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z"/>
                            </svg>
                          </button>
                        )}
                        <button onClick={() => handleDelete(task.id)} title="Excluir"
                          className="w-[22px] h-[22px] border border-[#30363d] rounded-md bg-transparent flex items-center justify-center hover:bg-[#21262d] hover:[&>svg]:fill-[#f85149] transition-colors">
                          <svg className="w-2.5 h-2.5 fill-[#8b949e]" viewBox="0 0 16 16">
                            <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.576l-.66-6.6a.75.75 0 1 1 1.492-.149ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z"/>
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
                ))}
              </div>
            </div>
          );
        })}
      </div>

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