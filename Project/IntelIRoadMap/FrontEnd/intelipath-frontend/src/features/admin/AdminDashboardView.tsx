import { useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Gauge,
  GraduationCap,
  Layout,
  MagnifyingGlass,
  PencilSimple,
  Pulse,
  ShieldCheck,
  Trash,
  UsersThree,
  Lightning,
  Prohibit,
  ArrowCounterClockwise
} from "@phosphor-icons/react"
import { useNavigate } from "react-router-dom"
import adminApi from "@/features/admin/api/adminApi"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  UserHeaderActions,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Logo,
  Select
} from "@/components"
import { useAuth } from "@/context"
import { toast } from "@/lib/toast"
import { ROLES, ROUTES } from "@/shared"
import { AdminContentTab, AdminMarketTab, AdminSystemTab } from "./components/AdminExtraTabs"
import { AdminFlmSyncTab } from "./components/AdminFlmSyncTab"
import type {
  AdminCourseMetric,
  AdminRole,
  AdminSystemHealth,
  AdminUserListItem,
  AdminUserMetric,
  AdminUserStatus
} from "./admin.types"

const USERS_PER_PAGE = 7
const ADMIN_ROLE_OPTIONS = [
  ROLES.STUDENT,
  ROLES.COUNSELOR,
  ROLES.MENTOR,
  ROLES.ADMIN
] as AdminRole[]

const roleVariant = (role: AdminRole) => {
  if (role === "ADMIN") return "destructive"
  if (role === "MENTOR") return "info"
  if (role === "COUNSELOR") return "warning"
  return "default"
}

type MetricCardProps = {
  label: string
  value?: string
  status?: ReactNode
  icon: ReactNode
  iconClassName: string
  isLoading: boolean
  isUnavailable?: boolean
  progress?: number
  progressClassName?: string
}

function MetricCard({
  label,
  value,
  status,
  icon,
  iconClassName,
  isLoading,
  isUnavailable = false,
  progress,
  progressClassName = "bg-indigo-600"
}: MetricCardProps) {
  return (
    <Card className="group min-h-[118px] overflow-hidden transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">
      <CardContent className="grid gap-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset ring-black/5 transition-transform group-hover:scale-105 ${iconClassName}`}>
              {icon}
            </div>
            <p className="truncate text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
          </div>
          {isLoading ? (
            <div className="h-5 w-14 shrink-0 animate-pulse rounded-full bg-slate-100" />
          ) : isUnavailable ? (
            <Badge className="shrink-0">Unavailable</Badge>
          ) : (
            status
          )}
        </div>

        {isLoading ? (
          <div className="h-8 w-24 animate-pulse rounded-lg bg-slate-100" />
        ) : (
          <p className="font-display text-[28px] font-semibold leading-none text-slate-950">
            {isUnavailable ? "--" : value}
          </p>
        )}

        {progress !== undefined && !isUnavailable && !isLoading && (
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${progressClassName}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SystemHealthCard({ health, isLoading }: { health?: AdminSystemHealth | null; isLoading: boolean }) {
  const isUnavailable = health === null
  const services = health?.services ?? []
  const operational = health?.status === "Operational"
  return (
    <Card className="group min-h-[118px] overflow-hidden transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">
      <CardContent className="grid gap-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-black/5 transition-transform group-hover:scale-105">
              <Gauge size={20} weight="duotone" />
            </div>
            <p className="truncate text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">System health</p>
          </div>
          {isLoading ? (
            <div className="h-5 w-20 shrink-0 animate-pulse rounded-full bg-slate-100" />
          ) : isUnavailable ? (
            <Badge className="shrink-0">Unavailable</Badge>
          ) : (
            <Badge variant={operational ? "success" : "warning"} className="shrink-0 gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${operational ? "animate-pulse bg-emerald-500" : "bg-amber-500"}`} />
              {health?.status}
            </Badge>
          )}
        </div>
        {isLoading ? (
          <div className="h-6 w-44 animate-pulse rounded bg-slate-100" />
        ) : isUnavailable ? (
          <p className="font-display text-[28px] font-semibold leading-none text-slate-950">--</p>
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-0.5">
            {services.map((service) => (
              <span key={service.name} className="flex items-center gap-1.5 text-[12.5px] font-medium text-slate-600">
                <span className={`h-2 w-2 rounded-full ${service.up ? "bg-emerald-500" : "bg-rose-500"}`} />
                {service.name}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AdminMetrics({ className = "" }: { className?: string }) {
  const [users, setUsers] = useState<AdminUserMetric | null>()
  const [courses, setCourses] = useState<AdminCourseMetric | null>()
  const [health, setHealth] = useState<AdminSystemHealth | null>()

  useEffect(() => {
    void adminApi.getTotalUsers().then(setUsers).catch(() => setUsers(null))
    void adminApi.getTotalCourses().then(setCourses).catch(() => setCourses(null))
    void adminApi.getSystemHealth().then(setHealth).catch(() => setHealth(null))
  }, [])

  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-3 ${className}`}>
      <MetricCard
        label="Total users"
        value={(users?.total ?? 0).toLocaleString()}
        status={users && (
          <Badge variant={users.growth < 0 ? "warning" : "info"}>
            {users.growth >= 0 ? "+" : ""}{users.growth}% / 30d
          </Badge>
        )}
        icon={<UsersThree size={20} weight="duotone" />}
        iconClassName="bg-indigo-50 text-indigo-700"
        isLoading={users === undefined}
        isUnavailable={users === null}
      />
      <MetricCard
        label="Courses"
        value={String(courses?.total ?? 0)}
        status={courses && <Badge variant="success">{courses.status}</Badge>}
        icon={<BookOpen size={20} weight="duotone" />}
        iconClassName="bg-indigo-50 text-indigo-700"
        isLoading={courses === undefined}
        isUnavailable={courses === null}
        progress={courses?.progress}
      />
      <SystemHealthCard health={health} isLoading={health === undefined} />
    </div>
  )
}

function UserManagement({ users, setUsers, isLoading }: {
  users: AdminUserListItem[]
  setUsers: Dispatch<SetStateAction<AdminUserListItem[]>>
  isLoading: boolean
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState<AdminRole | "ALL">("ALL")
  const [editingUser, setEditingUser] = useState<AdminUserListItem | null>(null)
  const [selectedRole, setSelectedRole] = useState<AdminRole>("STUDENT")
  const [roleError, setRoleError] = useState("")
  const [isSavingRole, setIsSavingRole] = useState(false)
  const [deletingUser, setDeletingUser] = useState<AdminUserListItem | null>(null)
  const [deleteError, setDeleteError] = useState("")
  const [isDeletingUser, setIsDeletingUser] = useState(false)
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null)

  const filteredUsers = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()
    return users.filter((user) => {
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter
      const matchesKeyword = !keyword
        || user.name.toLowerCase().includes(keyword)
        || (user.email || "").toLowerCase().includes(keyword)
      return matchesRole && matchesKeyword
    })
  }, [users, searchQuery, roleFilter])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * USERS_PER_PAGE
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE)
  const visibleStart = filteredUsers.length ? startIndex + 1 : 0
  const visibleEnd = Math.min(startIndex + USERS_PER_PAGE, filteredUsers.length)

  const openRoleEditor = (user: AdminUserListItem) => {
    setEditingUser(user)
    setSelectedRole(user.role)
    setRoleError("")
  }

  const saveRole = async () => {
    if (!editingUser) return
    setIsSavingRole(true)
    setRoleError("")
    try {
      const updatedUser = await adminApi.updateUserRole(editingUser.id, selectedRole)
      setUsers((current) => current.map((user) => user.id === editingUser.id ? { ...user, ...updatedUser } : user))
      setEditingUser(null)
    } catch {
      setRoleError("Could not update user role. Please try again.")
    } finally {
      setIsSavingRole(false)
    }
  }

  const toggleSuspend = async (user: AdminUserListItem) => {
    const nextStatus: AdminUserStatus = user.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED"
    setStatusBusyId(user.id)
    try {
      const updated = await adminApi.updateUserStatus(user.id, nextStatus)
      setUsers((current) => current.map((u) => u.id === user.id ? { ...u, ...updated } : u))
      toast.success(nextStatus === "SUSPENDED" ? "Account suspended." : "Account reactivated.")
    } catch {
      toast.error("Could not update account status. Please try again.")
    } finally {
      setStatusBusyId(null)
    }
  }

  const deleteUser = async () => {
    if (!deletingUser) return
    setIsDeletingUser(true)
    setDeleteError("")
    try {
      await adminApi.deleteUser(deletingUser.id)
      setUsers((current) => current.filter((user) => user.id !== deletingUser.id))
      setDeletingUser(null)
    } catch {
      setDeleteError("Could not delete this account. Please try again.")
    } finally {
      setIsDeletingUser(false)
    }
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="gap-4 border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <CardTitle>User management</CardTitle>
            <CardDescription>
              Showing {visibleStart} to {visibleEnd} of {filteredUsers.length} users
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" disabled={safeCurrentPage === 1 || !filteredUsers.length} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
                <ArrowLeft size={15} weight="bold" />
              </Button>
              <span className="min-w-24 text-center text-xs font-semibold text-slate-600">
                Page {safeCurrentPage} of {totalPages}
              </span>
              <Button variant="outline" size="icon" disabled={safeCurrentPage === totalPages || !filteredUsers.length} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>
                <ArrowRight size={15} weight="bold" />
              </Button>
            </div>
            <div className="flex h-10 w-full items-center gap-2.5 rounded-md border border-slate-200 bg-white px-3 transition focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/15 sm:w-72">
              <MagnifyingGlass className="shrink-0 text-slate-400" size={17} />
              <Input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Search users by name or email"
                className="h-auto min-w-0 flex-1 border-0 bg-transparent p-0 shadow-none focus:border-0 focus:ring-0"
              />
            </div>
          </div>
        </CardHeader>

        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 px-4 py-2.5 sm:px-5">
          {(["ALL", ...ADMIN_ROLE_OPTIONS] as const).map((r) => {
            const count = r === "ALL" ? users.length : users.filter((u) => u.role === r).length
            const active = roleFilter === r
            return (
              <button
                key={r}
                type="button"
                onClick={() => { setRoleFilter(r as AdminRole | "ALL"); setCurrentPage(1) }}
                className={`rounded-full px-3 py-1 text-[12px] font-semibold transition-colors ${active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {r === "ALL" ? "All" : r.charAt(0) + r.slice(1).toLowerCase()}
                <span className={`ml-1.5 ${active ? "opacity-70" : "text-slate-400"}`}>{count}</span>
              </button>
            )
          })}
        </div>

        <div className="relative">
          <div className="max-h-[calc(100vh-300px)] min-h-[280px] overflow-auto">
          <table className="w-full min-w-[860px] table-fixed text-left">
            <colgroup>
              <col className="w-[38%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[26%]" />
            </colgroup>
            <thead className="sticky top-0 z-10 border-b border-slate-200 bg-white text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && Array.from({ length: USERS_PER_PAGE }).map((_, i) => (
                <tr key={`sk-${i}`} className="h-[72px]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-slate-100" />
                      <div className="space-y-2">
                        <div className="h-3.5 w-32 animate-pulse rounded bg-slate-100" />
                        <div className="h-3 w-44 animate-pulse rounded bg-slate-100" />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4"><div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" /></td>
                  <td className="px-5 py-4"><div className="h-3.5 w-20 animate-pulse rounded bg-slate-100" /></td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <div className="h-8 w-[100px] animate-pulse rounded-md bg-slate-100" />
                      <div className="h-8 w-[100px] animate-pulse rounded-md bg-slate-100" />
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && paginatedUsers.map((user) => (
                <tr key={user.id} className="h-[72px] transition-colors hover:bg-slate-50/80">
                  <td className="px-5 py-4 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-bold text-white">
                        {user.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{user.name}</p>
                        <p className="max-w-[260px] truncate text-xs text-slate-400">
                          {user.email || `ID: ${user.id.slice(0, 8)}`}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <div className="flex items-center gap-2">
                      <Badge variant={roleVariant(user.role)}>{user.role}</Badge>
                      {user.status === "SUSPENDED" && (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-600 ring-1 ring-rose-100">Suspended</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 align-middle text-sm text-slate-500">{user.joinedDate}</td>
                  <td className="px-5 py-4 align-middle">
                    <div className="flex min-w-[300px] items-center justify-end gap-2">
                      <Button className="w-[100px]" variant="outline" size="sm" onClick={() => openRoleEditor(user)}>
                        <PencilSimple size={14} weight="bold" /> Edit role
                      </Button>
                      {user.status === "SUSPENDED" ? (
                        <Button variant="outline" size="sm" className="w-[110px] border-emerald-100 text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700" disabled={statusBusyId === user.id} onClick={() => toggleSuspend(user)}>
                          <ArrowCounterClockwise size={14} weight="bold" /> Activate
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="w-[110px] border-amber-100 text-amber-600 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700" disabled={statusBusyId === user.id} onClick={() => toggleSuspend(user)}>
                          <Prohibit size={14} weight="bold" /> Suspend
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="w-[100px] border-rose-100 text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700" onClick={() => setDeletingUser(user)}>
                        <Trash size={14} weight="bold" /> Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && paginatedUsers.length === 0 && (
            <div className="grid min-h-64 place-items-center px-5 text-center">
              <div>
                <MagnifyingGlass className="mx-auto text-slate-300" size={32} weight="duotone" />
                <p className="mt-3 text-sm font-semibold text-slate-700">No users found</p>
                <p className="mt-1 text-xs text-slate-500">Try another name or email.</p>
              </div>
            </div>
          )}
          </div>
          {!isLoading && paginatedUsers.length > 4 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16 bg-gradient-to-t from-white via-white/85 to-transparent" />
          )}
        </div>
      </Card>

      <Dialog open={Boolean(editingUser)} onOpenChange={(open) => !open && !isSavingRole && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user role</DialogTitle>
            <DialogDescription>Change access permissions for {editingUser?.name}.</DialogDescription>
          </DialogHeader>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Role</label>
          <Select
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value as AdminRole)}
            className="font-semibold"
          >
            {ADMIN_ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
          </Select>
          {roleError && <p className="mt-3 text-sm font-medium text-rose-600">{roleError}</p>}
          <DialogFooter>
            <Button variant="outline" disabled={isSavingRole} onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button variant="brand" disabled={isSavingRole} onClick={saveRole}>{isSavingRole ? "Saving..." : "Save role"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingUser)} onOpenChange={(open) => !open && !isDeletingUser && setDeletingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
            <DialogDescription>This permanently removes the user and cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-semibold text-rose-800">{deletingUser?.name}</p>
            <p className="mt-1 text-xs text-rose-600">Role: {deletingUser?.role}</p>
          </div>
          {deleteError && <p className="mt-3 text-sm font-medium text-rose-600">{deleteError}</p>}
          <DialogFooter>
            <Button variant="outline" disabled={isDeletingUser} onClick={() => setDeletingUser(null)}>Cancel</Button>
            <Button variant="destructive" disabled={isDeletingUser} onClick={deleteUser}>{isDeletingUser ? "Deleting..." : "Delete account"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

const ROLE_META: Record<AdminRole, { label: string; dot: string }> = {
  STUDENT: { label: "Students", dot: "bg-cyan-500" },
  MENTOR: { label: "Mentors", dot: "bg-violet-500" },
  COUNSELOR: { label: "Counselors", dot: "bg-amber-500" },
  ADMIN: { label: "Admins", dot: "bg-rose-500" }
}

function RoleDistribution({ users, isLoading }: { users: AdminUserListItem[]; isLoading: boolean }) {
  const total = users.length
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-base">Users by role</CardTitle>
        <CardDescription>{isLoading ? "Loading…" : `${total} accounts total`}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0">
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          {!isLoading && ADMIN_ROLE_OPTIONS.map((r) => {
            const pct = total ? (users.filter((u) => u.role === r).length / total) * 100 : 0
            return pct > 0 ? <div key={r} className={ROLE_META[r].dot} style={{ width: `${pct}%` }} /> : null
          })}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          {ADMIN_ROLE_OPTIONS.map((r) => (
            <div key={r} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${ROLE_META[r].dot}`} />
              <span className="text-[13px] text-slate-600">{ROLE_META[r].label}</span>
              <span className="ml-auto text-[13px] font-bold text-slate-900">
                {isLoading ? "—" : users.filter((u) => u.role === r).length}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function RecentSignups({ users, isLoading }: { users: AdminUserListItem[]; isLoading: boolean }) {
  const recent = [...users]
    .sort((a, b) => (b.joinedDate || "").localeCompare(a.joinedDate || ""))
    .slice(0, 5)
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-base">Recent sign-ups</CardTitle>
        <CardDescription>Newest accounts on the platform</CardDescription>
      </CardHeader>
      <CardContent className="p-2">
        {isLoading ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <div className="h-8 w-8 animate-pulse rounded-full bg-slate-100" />
                <div className="flex-1 space-y-1.5"><div className="h-3 w-28 animate-pulse rounded bg-slate-100" /><div className="h-2.5 w-16 animate-pulse rounded bg-slate-100" /></div>
              </div>
            ))}
          </div>
        ) : recent.length ? (
          <ul>
            {recent.map((u) => (
              <li key={u.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-950 text-[11px] font-bold text-white">
                  {u.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-slate-800">{u.name}</p>
                  <p className="text-[11px] text-slate-400">{u.joinedDate}</p>
                </div>
                <Badge variant={roleVariant(u.role)} className="shrink-0">{u.role}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-6 text-center text-sm text-slate-400">No accounts yet.</p>
        )}
      </CardContent>
    </Card>
  )
}

const ADMIN_TABS = [
  { key: "overview", label: "Overview", icon: Layout },
  { key: "users", label: "Users", icon: UsersThree },
  { key: "content", label: "Content", icon: GraduationCap },
  { key: "curriculum", label: "Curriculum", icon: BookOpen },
  { key: "market", label: "Market", icon: Pulse },
  { key: "system", label: "System", icon: Gauge }
] as const
type AdminTab = (typeof ADMIN_TABS)[number]["key"]

export default function AdminDashboardView() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<AdminTab>("overview")
  const [isTriggering, setIsTriggering] = useState(false)
  const [isTriggeringScraper, setIsTriggeringScraper] = useState(false)

  // Users are fetched once here and shared by the Overview insights and the
  // Users tab (which also mutates them on role change / delete).
  const [users, setUsers] = useState<AdminUserListItem[]>([])
  const [usersLoading, setUsersLoading] = useState(true)

  useEffect(() => {
    void adminApi.getUsersList()
      .then((response) => setUsers(Array.isArray(response) ? response : []))
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false))
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LOGIN)
  }

  const handleTriggerJob = async () => {
    setIsTriggering(true)
    try {
      await adminApi.triggerSkillExtraction()
      toast.success("Skill extraction job started successfully.")
    } catch (error) {
      toast.error("Failed to trigger skill extraction job.")
    } finally {
      setIsTriggering(false)
    }
  }

  const handleTriggerScraper = async (source: "topcv" | "itviec" = "topcv") => {
    setIsTriggeringScraper(true)
    try {
      await adminApi.triggerJobScraper(source)
      toast.success(`${source === "itviec" ? "ITviec" : "TopCV"} job scraper started successfully.`)
    } catch (error) {
      toast.error(`Failed to trigger ${source === "itviec" ? "ITviec" : "TopCV"} job scraper.`)
    } finally {
      setIsTriggeringScraper(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-14 font-sans text-slate-950">
      <header className="sticky top-0 z-40 shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-8">
            <Logo iconOnly className="origin-left scale-90" />
            <nav className="hidden items-center gap-8 lg:flex">
              {ADMIN_TABS.map(({ key, label, icon: NavIcon }) => {
                const active = tab === key
                return (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`relative flex h-[72px] items-center gap-2 border-b-[3px] px-0 text-sm font-semibold transition-colors ${
                      active
                        ? "border-indigo-600 text-indigo-700"
                        : "border-transparent text-slate-500 hover:text-slate-950"
                    }`}
                  >
                    <NavIcon size={17} weight="duotone" />
                    {label}
                  </button>
                )
              })}
            </nav>
          </div>
          <UserHeaderActions user={user} onLogout={handleLogout} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] px-4 py-5 md:px-8">
        {/* Mobile tab switcher (nav is desktop-only) */}
        <div className="mb-4 flex gap-1.5 overflow-x-auto lg:hidden">
          {ADMIN_TABS.map(({ key, label, icon: NavIcon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                tab === key ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
              }`}
            >
              <NavIcon size={15} weight="duotone" /> {label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
        <>
        {/* Slim header: title on the left, run-job actions inline on the right. */}
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">
              <ShieldCheck size={15} weight="duotone" /> Administration
            </div>
            <h1 className="font-display text-2xl font-semibold leading-tight text-slate-950">System overview</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleTriggerJob}
              disabled={isTriggering || isTriggeringScraper}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 shadow-sm transition-colors hover:border-indigo-300 hover:text-indigo-700 disabled:pointer-events-none disabled:opacity-50"
            >
              <Lightning size={15} weight="duotone" className={`text-indigo-600 ${isTriggering ? "animate-pulse" : ""}`} />
              {isTriggering ? "Extracting…" : "Skill Extraction"}
            </button>
            <button
              type="button"
              onClick={() => handleTriggerScraper("itviec")}
              disabled={isTriggeringScraper || isTriggering}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 shadow-sm transition-colors hover:border-indigo-300 hover:text-indigo-700 disabled:pointer-events-none disabled:opacity-50"
            >
              <Lightning size={15} weight="duotone" className={`text-indigo-600 ${isTriggeringScraper ? "animate-pulse" : ""}`} />
              {isTriggeringScraper ? "Scraping…" : "ITviec Jobs"}
            </button>
            <button
              type="button"
              onClick={() => handleTriggerScraper("topcv")}
              disabled={isTriggeringScraper || isTriggering}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 shadow-sm transition-colors hover:border-indigo-300 hover:text-indigo-700 disabled:pointer-events-none disabled:opacity-50"
            >
              <Lightning size={15} weight="duotone" className={`text-indigo-600 ${isTriggeringScraper ? "animate-pulse" : ""}`} />
              {isTriggeringScraper ? "Scraping…" : "TopCV Jobs"}
            </button>
          </div>
        </div>

        <AdminMetrics />

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RoleDistribution users={users} isLoading={usersLoading} />
          <RecentSignups users={users} isLoading={usersLoading} />
        </div>
        </>
        )}

        {tab === "users" && (
          <UserManagement users={users} setUsers={setUsers} isLoading={usersLoading} />
        )}

        {tab === "content" && <AdminContentTab />}

        {tab === "curriculum" && <AdminFlmSyncTab />}

        {tab === "market" && <AdminMarketTab />}

        {tab === "system" && <AdminSystemTab />}
      </main>
    </div>
  )
}
