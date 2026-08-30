import { useCallback, useEffect, useState } from "react"
import { BookOpen, Plus, Trash, Users, X } from "@phosphor-icons/react"
import courseApi, { type Course, type CourseLevel, type CourseLesson } from "../api/courseApi"
import { emitToast } from "@/lib/toast"
import { Select } from "@/components"
import ConfirmModal from "@/components/modals/ConfirmModal"

interface Props {
  careerId: string
  nodeId: string
}

const LEVELS: CourseLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"]
const blankForm = () => ({
  title: "",
  description: "",
  level: "BEGINNER" as CourseLevel,
  lessons: [{ title: "", resourceUrl: "" }] as CourseLesson[],
})

/** Manage the courses attached to one roadmap node, inline in the editor panel. */
export function NodeCoursesSection({ careerId, nodeId }: Props) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(blankForm())
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Course | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await courseApi.listMine()
      setCourses((res.data || []).filter(c => c.nodeId === nodeId))
    } catch { setCourses([]) }
    finally { setLoading(false) }
  }, [nodeId])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setForm(blankForm()); setEditingId(null); setAdding(true) }
  const openEdit = (c: Course) => {
    setForm({
      title: c.title,
      description: c.description || "",
      level: c.level,
      lessons: c.lessons?.length ? c.lessons.map(l => ({ title: l.title, resourceUrl: l.resourceUrl })) : [{ title: "", resourceUrl: "" }],
    })
    setEditingId(c.courseId)
    setAdding(true)
  }

  const setLesson = (i: number, patch: Partial<CourseLesson>) =>
    setForm(f => ({ ...f, lessons: f.lessons.map((l, idx) => idx === i ? { ...l, ...patch } : l) }))

  const save = async () => {
    if (!form.title.trim()) { emitToast("Course title is required.", "error"); return }
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        level: form.level,
        careerId,
        nodeId,
        lessons: form.lessons.filter(l => l.title.trim()),
      }
      if (editingId) await courseApi.update(editingId, payload)
      else await courseApi.create(payload)
      emitToast(editingId ? "Course updated." : "Course added to this node.", "success")
      setAdding(false)
      await load()
    } catch { emitToast("Couldn't save the course.", "error") }
    finally { setSaving(false) }
  }

  const togglePublish = async (c: Course) => {
    try { await courseApi.setPublished(c.courseId, c.status !== "PUBLISHED"); await load() }
    catch { emitToast("Couldn't change publish state.", "error") }
  }
  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await courseApi.remove(pendingDelete.courseId)
      setPendingDelete(null)
      await load()
    } catch {
      emitToast("Couldn't delete.", "error")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mt-1 border-t border-slate-100 pt-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <BookOpen size={12} weight="bold" /> Courses for this node
        </p>
        {!adding && (
          <button onClick={openCreate} className="flex items-center gap-1 text-[11px] font-semibold text-cyan-700 hover:text-cyan-800">
            <Plus size={11} weight="bold" /> Add
          </button>
        )}
      </div>

      {loading ? (
        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <div className="grid gap-1.5">
          {courses.map(c => (
            <div key={c.courseId} className="rounded-lg border border-slate-200 px-2.5 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[12.5px] font-semibold text-slate-800">{c.title}</p>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${c.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>{c.status}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="flex items-center gap-1 text-[10.5px] text-slate-400">
                  {c.lessonCount} lessons · <Users size={10} weight="duotone" /> {c.enrolledCount}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => togglePublish(c)} className="rounded px-1.5 py-0.5 text-[10.5px] font-medium text-slate-500 hover:bg-slate-100">{c.status === "PUBLISHED" ? "Unpublish" : "Publish"}</button>
                  <button onClick={() => openEdit(c)} className="rounded px-1.5 py-0.5 text-[10.5px] font-medium text-cyan-700 hover:bg-cyan-50">Edit</button>
                  <button onClick={() => setPendingDelete(c)} className="grid h-5 w-5 place-items-center rounded text-slate-300 hover:bg-red-50 hover:text-red-600"><Trash size={11} /></button>
                </div>
              </div>
            </div>
          ))}
          {courses.length === 0 && !adding && (
            <p className="rounded-lg border border-dashed border-slate-200 px-3 py-3 text-center text-[11px] text-slate-400">No courses yet for this node.</p>
          )}
        </div>
      )}

      {adding && (
        <div className="mt-2 rounded-lg border border-cyan-200 bg-cyan-50/40 p-2.5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-700">{editingId ? "Edit course" : "New course"}</p>
            <button onClick={() => setAdding(false)} className="text-slate-400 hover:text-slate-700"><X size={13} /></button>
          </div>
          <div className="grid gap-1.5">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Course title" className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-[12px] outline-none focus:border-cyan-500" />
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description" rows={2} className="w-full resize-none rounded-md border border-slate-200 px-2.5 py-1.5 text-[12px] outline-none focus:border-cyan-500" />
            <Select className="h-8 text-[12px]" value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as CourseLevel }))}>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </Select>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Lessons</span>
                <button onClick={() => setForm(f => ({ ...f, lessons: [...f.lessons, { title: "", resourceUrl: "" }] }))} className="text-[10.5px] font-semibold text-cyan-700">+ Add</button>
              </div>
              {form.lessons.map((l, i) => (
                <div key={i} className="mb-1 flex items-center gap-1">
                  <input value={l.title} onChange={e => setLesson(i, { title: e.target.value })} placeholder={`Lesson ${i + 1}`} className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-[11.5px] outline-none focus:border-cyan-500" />
                  {form.lessons.length > 1 && <button onClick={() => setForm(f => ({ ...f, lessons: f.lessons.filter((_, idx) => idx !== i) }))} className="text-slate-300 hover:text-red-600"><Trash size={12} /></button>}
                </div>
              ))}
            </div>
            <button onClick={save} disabled={saving} className="mt-1 h-8 rounded-md bg-slate-900 text-[12px] font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
              {saving ? "Saving…" : editingId ? "Save course" : "Add course"}
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete course?"
        message={pendingDelete ? `"${pendingDelete.title}" will be removed. This cannot be undone.` : ""}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}

export default NodeCoursesSection
