import { useState, useEffect } from 'react'
import { supabase } from '../../libs/supabase'
import PageContainer from '../../components/layout/PageContainer'
import { getXPLevel } from '../../lib/xpCalculator'
import {
  Users,
  Search,
  Edit3,
  Save,
  X,
  Shield,
  Loader2,
  CalendarDays,
  Clock
} from 'lucide-react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import clsx from 'clsx'
import toast from 'react-hot-toast'

type UserRole = 'employee' | 'admin' | 'boss'

interface Employee {
  id: string
  full_name: string
  employee_id: string | null
  role: UserRole
  department: string | null
  total_xp: number
  streak_days: number
  created_at: string
}

interface ShiftOption {
  id: string
  name: string
  start_time: string
  end_time: string
}

const roleLabels: Record<UserRole, string> = {
  employee: 'Karyawan',
  admin: 'Admin',
  boss: 'Pimpinan',
}

const roleBadge: Record<UserRole, string> = {
  employee: 'bg-primary-50 text-primary',
  admin: 'bg-warning-light text-warning',
  boss: 'bg-purple-light text-purple',
}

const containerVars: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const itemVars: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

export default function ManageEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState<UserRole>('employee')
  const [editDept, setEditDept] = useState('')
  const [saving, setSaving] = useState(false)

  // Scheduling State
  const [schedulingId, setSchedulingId] = useState<string | null>(null)
  const [shifts, setShifts] = useState<ShiftOption[]>([])
  const [selectedShift, setSelectedShift] = useState('')
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  })
  const [scheduling, setScheduling] = useState(false)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, employee_id, role, department, total_xp, streak_days, created_at')
      .order('full_name', { ascending: true })

    if (!error && data) {
      setEmployees(data as Employee[])
    }
    
    // Fetch shifts for the dropdown
    const { data: shiftData } = await supabase.from('shifts').select('id, name, start_time, end_time')
    if (shiftData) setShifts(shiftData)

    setLoading(false)
  }

  const startEditing = (emp: Employee) => {
    setEditingId(emp.id)
    setSchedulingId(null)
    setEditRole(emp.role)
    setEditDept(emp.department || '')
  }

  const startScheduling = (emp: Employee) => {
    setSchedulingId(emp.id)
    setEditingId(null)
    if (shifts.length > 0) setSelectedShift(shifts[0].id)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditRole('employee')
    setEditDept('')
  }

  const saveChanges = async (empId: string) => {
    setSaving(true)
    const { error } = await supabase
      .from('users')
      .update({
        role: editRole,
        department: editDept.trim() || null,
      })
      .eq('id', empId)

    if (error) {
      toast.error('Gagal menyimpan: ' + error.message)
    } else {
      toast.success('Data karyawan berhasil diperbarui!')
      setEditingId(null)
      fetchEmployees()
    }
    setSaving(false)
  }

  const saveSchedule = async (empId: string) => {
    if (!selectedShift || !selectedDate) {
      toast.error('Pilih shift dan tanggal terlebih dahulu')
      return
    }
    setScheduling(true)
    const { error } = await supabase
      .from('user_shifts')
      .upsert(
        { user_id: empId, shift_id: selectedShift, work_date: selectedDate },
        { onConflict: 'user_id, work_date' }
      )
    
    if (error) {
      toast.error('Gagal mengatur shift: ' + error.message)
    } else {
      toast.success('Jadwal shift berhasil diatur!')
      setSchedulingId(null)
    }
    setScheduling(false)
  }

  const filtered = employees.filter(
    (e) =>
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (e.department || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.employee_id || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PageContainer>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800 flex items-center gap-2">
              <Users size={24} className="text-primary" />
              Kelola Karyawan
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Edit role dan departemen karyawan.
            </p>
          </div>
          <div className="glass-card-sm flex items-center gap-2 px-3 py-2 self-start sm:self-auto">
            <Search size={16} className="text-neutral-400" />
            <input
              type="text"
              placeholder="Cari nama, ID, dept..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm text-neutral-800 placeholder-neutral-400 w-48"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-5 h-20 animate-pulse bg-white/40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-800">Tidak ditemukan</h3>
            <p className="text-sm text-neutral-500 mt-1">
              Tidak ada karyawan yang cocok dengan pencarian.
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVars}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {/* Header Row (desktop) */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              <div className="col-span-3">Nama</div>
              <div className="col-span-2">ID Karyawan</div>
              <div className="col-span-2">Departemen</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-1">XP</div>
              <div className="col-span-2 text-right">Aksi</div>
            </div>

            {filtered.map((emp) => {
              const level = getXPLevel(emp.total_xp)
              const isEditing = editingId === emp.id
              const isScheduling = schedulingId === emp.id

              return (
                <motion.div
                  key={emp.id}
                  variants={itemVars}
                  className={clsx(
                    'glass-card p-4 lg:p-5 transition-all',
                    (isEditing || isScheduling) ? 'ring-2 ring-primary/30 shadow-glass' : 'hover:shadow-glass-sm'
                  )}
                >
                  {/* Mobile Layout */}
                  <div className="lg:hidden space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {emp.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-neutral-800 text-sm truncate">
                          {emp.full_name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {emp.employee_id || '—'} • {emp.department || 'Belum diatur'}
                        </p>
                      </div>
                      <span className={`badge ${roleBadge[emp.role]}`}>
                        {roleLabels[emp.role]}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">
                        {level.emoji} {emp.total_xp} XP
                      </span>
                      {!isEditing && !isScheduling ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => startScheduling(emp)}
                            className="text-neutral-500 hover:text-primary-600 text-sm font-medium flex items-center gap-1"
                          >
                            <CalendarDays size={14} /> Shift
                          </button>
                          <button
                            onClick={() => startEditing(emp)}
                            className="text-primary hover:text-primary-600 text-sm font-medium flex items-center gap-1"
                          >
                            <Edit3 size={14} /> Edit
                          </button>
                        </div>
                      ) : isEditing ? (
                        <div className="flex gap-2">
                          <button
                            onClick={cancelEditing}
                            className="text-neutral-500 hover:text-neutral-700 text-sm"
                          >
                            <X size={16} />
                          </button>
                          <button
                            onClick={() => saveChanges(emp.id)}
                            disabled={saving}
                            className="text-success hover:text-emerald-700 text-sm font-medium flex items-center gap-1"
                          >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            Simpan
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSchedulingId(null)}
                            className="text-neutral-500 hover:text-neutral-700 text-sm"
                          >
                            <X size={16} />
                          </button>
                          <button
                            onClick={() => saveSchedule(emp.id)}
                            disabled={scheduling}
                            className="text-success hover:text-emerald-700 text-sm font-medium flex items-center gap-1"
                          >
                            {scheduling ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            Simpan Shift
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditing && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100"
                      >
                        <div>
                          <label className="text-xs font-medium text-neutral-600 mb-1 block">Role</label>
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as UserRole)}
                            className="input-field text-sm py-2"
                          >
                            <option value="employee">Karyawan</option>
                            <option value="admin">Admin</option>
                            <option value="boss">Pimpinan</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-neutral-600 mb-1 block">Departemen</label>
                          <input
                            type="text"
                            value={editDept}
                            onChange={(e) => setEditDept(e.target.value)}
                            placeholder="e.g. IT, HR"
                            className="input-field text-sm py-2"
                          />
                        </div>
                      </motion.div>
                    )}

                    {isScheduling && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100"
                      >
                        <div>
                          <label className="text-xs font-medium text-neutral-600 mb-1 block">Pilih Shift</label>
                          <select
                            value={selectedShift}
                            onChange={(e) => setSelectedShift(e.target.value)}
                            className="input-field text-sm py-2"
                          >
                            {shifts.map(s => (
                              <option key={s.id} value={s.id}>{s.name} ({s.start_time.slice(0,5)} - {s.end_time.slice(0,5)})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-neutral-600 mb-1 block">Tanggal Berlakunya</label>
                          <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="input-field text-sm py-2"
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {emp.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <p className="font-semibold text-neutral-800 text-sm truncate">
                        {emp.full_name}
                      </p>
                    </div>

                    <div className="col-span-2 text-sm text-neutral-600 font-mono">
                      {emp.employee_id || '—'}
                    </div>

                    <div className="col-span-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDept}
                          onChange={(e) => setEditDept(e.target.value)}
                          placeholder="Departemen"
                          className="input-field text-sm py-1.5"
                        />
                      ) : (
                        <span className="text-sm text-neutral-600">
                          {emp.department || '—'}
                        </span>
                      )}
                    </div>

                    <div className="col-span-2">
                      {isEditing ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as UserRole)}
                          className="input-field text-sm py-1.5"
                        >
                          <option value="employee">Karyawan</option>
                          <option value="admin">Admin</option>
                          <option value="boss">Pimpinan</option>
                        </select>
                      ) : (
                        <span className={`badge ${roleBadge[emp.role]}`}>
                          <Shield size={12} />
                          {roleLabels[emp.role]}
                        </span>
                      )}
                    </div>

                    <div className="col-span-1 text-sm text-neutral-700 font-tabular">
                      {level.emoji} {emp.total_xp}
                    </div>

                    <div className="col-span-2 flex justify-end gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={cancelEditing}
                            className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors"
                          >
                            <X size={16} />
                          </button>
                          <button
                            onClick={() => saveChanges(emp.id)}
                            disabled={saving}
                            className="btn-primary !px-4 !py-2 text-sm"
                          >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            Simpan
                          </button>
                        </>
                      ) : isScheduling ? (
                        <>
                          <button
                            onClick={() => setSchedulingId(null)}
                            className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors"
                          >
                            <X size={16} />
                          </button>
                          <button
                            onClick={() => saveSchedule(emp.id)}
                            disabled={scheduling}
                            className="btn-primary !px-4 !py-2 text-sm"
                          >
                            {scheduling ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            Simpan Shift
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startScheduling(emp)}
                            className="p-2 rounded-lg hover:bg-primary-50 text-neutral-500 transition-colors"
                            title="Atur Shift"
                          >
                            <CalendarDays size={16} />
                          </button>
                          <button
                            onClick={() => startEditing(emp)}
                            className="p-2 rounded-lg hover:bg-primary-50 text-primary transition-colors"
                            title="Edit User"
                          >
                            <Edit3 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Desktop Scheduling Dropdown */}
                  <AnimatePresence>
                    {isScheduling && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="hidden lg:block overflow-hidden"
                      >
                        <div className="mt-4 p-4 bg-neutral-50 border-t-2 border-dashed border-neutral-200 rounded-b-xl flex gap-4 items-end">
                          <div className="flex-1">
                            <label className="text-xs font-bold text-neutral-700 mb-1.5 block">Pilih Jadwal Shift</label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                              <select
                                value={selectedShift}
                                onChange={(e) => setSelectedShift(e.target.value)}
                                className="input-field pl-9 bg-white"
                              >
                                {shifts.map(s => (
                                  <option key={s.id} value={s.id}>{s.name} ({s.start_time.slice(0,5)} - {s.end_time.slice(0,5)})</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-bold text-neutral-700 mb-1.5 block">Tanggal Berlakunya</label>
                            <div className="relative">
                              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                              <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="input-field pl-9 bg-white font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </PageContainer>
  )
}
