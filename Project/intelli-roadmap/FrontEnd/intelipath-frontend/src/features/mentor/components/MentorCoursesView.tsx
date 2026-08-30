import { useEffect, useMemo, useState } from "react"
import { BookOpen, Plus, Trash, PencilSimple, Users, GraduationCap, X } from "@phosphor-icons/react"
import { ENDPOINTS, mainClient } from "@/shared/api"
import courseApi, { type Course, type CourseLevel, type CourseLesson } from "../api/courseApi"
import roadmapEditorApi, { type EditorNode } from "../api/roadmapEditorApi"
import { emitToast } from "@/lib/toast"
import { Select } from "@/components"
import ConfirmModal from "@/components/modals/ConfirmModal"

interface CareerOption { careerId: string; careerName: string }

const LEVELS: CourseLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"]

const emptyForm = () => ({
  title: "",
  description: "",
  level: "BEGINNER" as CourseLevel,
  careerId: "",
  nodeId: "",
  lessons: [{ title: "", content: "", resourceUrl: "" }] as CourseLesson[],
})

export function MentorCoursesView() {
  const [courses, setCourses] = useState<Course[]>([])
  const [careers, setCareers] = useState<CareerOption[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [nodes, setNodes] = useState<EditorNode[]>([])
  const [pendingDelete, setPendingDelete] = useState<Course | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Load the roadmap nodes of the selected career so the mentor can pin the course to one.
  useEffect(() => {
    if (!showForm || !form.careerId) { setNodes([]); return }
    let alive = true
    roadmapEditorApi.getCareerNodes(form.careerId)
      .then(res => { if (alive) setNodes(res.data || []) })
      .catch(() => { if (alive) setNodes([]) })
    return () => { alive = false }
  }, [form.careerId, showForm])

  const load = async () => {
    setLoading(true)
    try {
      const [c, cr] = await Promise.all([
        courseApi.listMine(),
        mainClient.get<CareerOption[]>(ENDPOINTS.CAREER_ROLES.LIST),
      ])
      setCourses(c.data || [])
      setCareers(cr.data || [])
    } catch {
      emitToast("Couldn't load your courses.", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setForm(emptyForm()); setEditingId(null); setShowForm(true) }
  const openEdit = (c: Course) => {
    setForm({
      title: c.title,
      description: c.description || "",
      level: c.level,
      careerId: c.careerId || "",
      nodeId: c.nodeId || "",
      lessons: c.lessons && c.lessons.length ? c.lessons.map(l => ({ ...l })) : [{ title: "", content: "", resourceUrl: "" }],
    })
    setEditingId(c.courseId)
    setShowForm(true)
  }

  const setLesson = (i: number, patch: Partial<CourseLesson>) =>
    setForm(f => ({ ...f, lessons: f.lessons.map((l, idx) => idx === i ? { ...l, ...patch } : l) }))
  const addLesson = () => setForm(f => ({ ...f, lessons: [...f.lessons, { title: "", content: "", resourceUrl: "" }] }))
  const removeLesson = (i: number) => setForm(f => ({ ...f, lessons: f.lessons.filter((_, idx) => idx !== i) }))

  const canSave = form.title.trim() && form.careerId

  const save = async () => {
    if (!canSave) { emitToast("Title and career are required.", "error"); return }
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        level: form.level,
        careerId: form.careerId,
        nodeId: form.nodeId || null,
        lessons: form.lessons.filter(l => l.title.trim()),
      }
      if (editingId) await courseApi.update(editingId, payload)
      else await courseApi.create(payload)
      emitToast(editingId ? "Course updated." : "Course created.", "success")
      setShowForm(false)
      await load()
    } catch {
      emitToast("Couldn't save the course.", "error")
    } finally {
      setSaving(false)
    }
  }

  const togglePublish = async (c: Course) => {
    try {
      await courseApi.setPublished(c.courseId, c.status !== "PUBLISHED")
      emitToast(c.status === "PUBLISHED" ? "Course unpublished." : "Course published.", "success")
      await load()
    } catch { emitToast("Couldn't change publish state.", "error") }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await courseApi.remove(pendingDelete.courseId)
      emitToast("Course deleted.", "success")
      setPendingDelete(null)
      await load()
    } catch {
      emitToast("Couldn't delete the course.", "error")
    } finally {
      setDeleting(false)
    }
  }

  const careerName = useMemo(() => {
    const map = new Map(careers.map(c => [c.careerId, c.careerName]))
    return (id?: string) => (id ? map.get(id) : undefined)
  }, [careers])

  return (
    <div className="mx-auto max-w-5xl px-1 py-2">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-[22px] font-bold text-slate-900">
            <BookOpen size={22} weight="duotone" className="text-indigo-600" /> Courses
          </h1>
          <p className="text-[13px] text-slate-500">Publish learning courses for a career path. Students on that roadmap can enroll.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-slate-800">
          <Plus size={15} weight="bold" /> New course
        </button>
      </div>

      {loading ? (
        <div className="grid gap-3">{[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}</div>
      ) : courses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          No courses yet. Create one to help students on a roadmap.
        </div>
      ) : (
        <div className="grid gap-3">
          {courses.map(c => (
            <div key={c.courseId} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[15px] font-bold text-slate-900">{c.title}</p>
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${c.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{c.status}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[13px] text-slate-500">{c.description || "No description."}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-500">
                    <span className="flex items-center gap-1"><GraduationCap size={13} weight="duotone" /> {careerName(c.careerId) || "—"}</span>
                    {c.nodeName && <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-medium text-indigo-600">→ {c.nodeName}</span>}
                    <span>{c.level}</span>
                    <span>{c.lessonCount} lessons</span>
                    <span className="flex items-center gap-1"><Users size={13} weight="duotone" /> {c.enrolledCount} enrolled</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button onClick={() => togglePublish(c)} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50">
                    {c.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                  </button>
                  <button onClick={() => openEdit(c)} className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-indigo-600"><PencilSimple size={16} /></button>
                  <button onClick={() => setPendingDelete(c)} className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 py-10" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[17px] font-bold text-slate-900">{editingId ? "Edit course" : "New course"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>

            <div className="grid gap-3">
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Course title" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[14px] outline-none focus:border-indigo-400" />
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What will students learn?" rows={3} className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-[14px] outline-none focus:border-indigo-400" />
              <div className="grid grid-cols-2 gap-3">
                <Select className="rounded-lg" value={form.careerId} onChange={e => setForm(f => ({ ...f, careerId: e.target.value, nodeId: "" }))}>
                  <option value="">Select career path…</option>
                  {careers.map(c => <option key={c.careerId} value={c.careerId}>{c.careerName}</option>)}
                </Select>
                <Select className="rounded-lg" value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as CourseLevel }))}>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </Select>
              </div>

              <Select
                className="rounded-lg"
                value={form.nodeId}
                onChange={e => setForm(f => ({ ...f, nodeId: e.target.value }))}
                disabled={!form.careerId}
              >
                <option value="">Whole career (no specific node)</option>
                {nodes.map(n => <option key={n.nodeId} value={n.nodeId}>Node: {n.nodeName}</option>)}
              </Select>

              <div className="mt-1">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-slate-700">Lessons</p>
                  <button onClick={addLesson} className="flex items-center gap-1 text-[12px] font-medium text-indigo-600 hover:text-indigo-800"><Plus size={13} weight="bold" /> Add lesson</button>
                </div>
                <div className="grid gap-2">
                  {form.lessons.map((l, i) => (
                    <div key={i} className="rounded-lg border border-slate-200 p-2.5">
                      <div className="flex items-center gap-2">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-100 text-[11px] font-bold text-slate-500">{i + 1}</span>
                        <input value={l.title} onChange={e => setLesson(i, { title: e.target.value })} placeholder="Lesson title" className="flex-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-[13px] outline-none focus:border-indigo-400" />
                        {form.lessons.length > 1 && <button onClick={() => removeLesson(i)} className="text-slate-300 hover:text-rose-600"><Trash size={15} /></button>}
                      </div>
                      <input value={l.resourceUrl || ""} onChange={e => setLesson(i, { resourceUrl: e.target.value })} placeholder="Resource URL (optional)" className="mt-2 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-[12.5px] outline-none focus:border-indigo-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={save} disabled={!canSave || saving} className="rounded-lg bg-slate-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-slate-800 disabled:opacity-50">
                {saving ? "Saving…" : editingId ? "Save changes" : "Create course"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete course?"
        message={pendingDelete
          ? `"${pendingDelete.title}" will be removed and enrolled students will lose access. This cannot be undone.`
          : ""}
        confirmLabel="Delete course"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}

export default MentorCoursesView
