import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context"
import { ROUTES } from "@/shared"
import { AddStudentForm, AddedStudent, FormErrors } from "../types"
import counselorApi from "../api/counselorApi"
import * as xlsx from "xlsx"
const validateForm = (form: AddStudentForm): FormErrors => {
  const errors: FormErrors = {}
  if (!form.email.trim()) errors.email = "Email is required."
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "Enter a valid email address."

  if (!form.fullName?.trim()) errors.fullName = "Full name is required."
  else if (!/[a-zA-ZÀ-ỹ]/.test(form.fullName))
    errors.fullName = "Full name must contain at least one letter."

  if (!form.admissionDate) errors.admissionDate = "Admission date is required."
  if (!form.major?.trim()) errors.major = "Major is required."
  if (!form.curriculum?.trim()) errors.curriculum = "Curriculum is required."

  return errors
}

export function useCounselorAddStudent() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState<AddStudentForm>({
    email: "",
    fullName: "",
    admissionDate: new Date().toISOString().split("T")[0],
    major: "Software Engineer",
    curriculum: ""
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [addedStudents, setAddedStudents] = useState<AddedStudent[]>(() => {
    try {
      const saved = localStorage.getItem("counselorDraftStudents")
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null)
  const [curriculums, setCurriculums] = useState<string[]>([])

  useEffect(() => {
    const fetchCurriculums = async () => {
      try {
        const data = await counselorApi.getCurriculums()
        const curriculumsList = data.curriculums || []
        setCurriculums(curriculumsList)
        if (curriculumsList.length > 0) {
          setForm((prev) =>
            prev.curriculum === ""
              ? { ...prev, curriculum: curriculumsList[0] }
              : prev
          )
        }
      } catch (err) {
        console.error("Failed to fetch curriculums", err)
      }
    }
    fetchCurriculums()
  }, [])

  useEffect(() => {
    localStorage.setItem(
      "counselorDraftStudents",
      JSON.stringify(addedStudents)
    )
  }, [addedStudents])

  const handleChange = (field: keyof AddStudentForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }))
    setSuccessMsg(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validateForm(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setIsSubmitting(true)
    setSuccessMsg(null)

    try {
      // 1. Check if email already exists in drafts (Recently Added Students)
      const draftExists = addedStudents.some(
        (s) =>
          s.email.toLowerCase() === form.email.trim().toLowerCase() &&
          s.id !== editingDraftId
      )

      if (draftExists) {
        setErrors({
          general: "This email already exists in the draft list below."
        })
        setIsSubmitting(false)
        return
      }

      // 2. Check if email already exists in the backend
      const emailExists = await counselorApi.checkStudentEmail(
        form.email.trim()
      )
      if (emailExists) {
        setErrors({ general: "This email already exists in the system." })
        setIsSubmitting(false)
        return
      }

      if (editingDraftId) {
        setAddedStudents((prev) =>
          prev.map((s) =>
            s.id === editingDraftId
              ? {
                  ...s,
                  email: form.email.trim(),
                  fullName: form.fullName.trim(),
                  admissionDate: form.admissionDate,
                  major: form.major.trim(),
                  curriculum: form.curriculum.trim()
                }
              : s
          )
        )
        setSuccessMsg(`Draft for "${form.fullName.trim()}" has been updated.`)
        setEditingDraftId(null)
      } else {
        const newStudent: AddedStudent = {
          id: crypto.randomUUID(),
          email: form.email.trim(),
          fullName: form.fullName.trim(),
          admissionDate: form.admissionDate,
          major: form.major.trim(),
          curriculum: form.curriculum.trim(),
          addedAt: new Date().toLocaleString("vi-VN")
        }
        setAddedStudents((prev) => [newStudent, ...prev])
        setSuccessMsg(
          `Student "${form.fullName.trim()}" has been added successfully.`
        )
      }
      setForm({
        email: "",
        fullName: "",
        admissionDate: new Date().toISOString().split("T")[0],
        major: "Software Engineer",
        curriculum: curriculums.length > 0 ? curriculums[0] : ""
      })
    } catch (err: any) {
      setErrors({
        general:
          err?.response?.data?.message ||
          "Failed to add student. Please try again."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LOGIN)
  }

  const handleDeleteDraft = (id: string) => {
    setAddedStudents((prev) => prev.filter((s) => s.id !== id))
  }

  const handleEditDraft = (id: string) => {
    const student = addedStudents.find((s) => s.id === id)
    if (student) {
      setForm({
        email: student.email,
        fullName: student.fullName,
        admissionDate: student.admissionDate,
        major: student.major,
        curriculum: student.curriculum
      })
      setEditingDraftId(id)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const cancelEdit = () => {
    setEditingDraftId(null)
    setForm({
      email: "",
      fullName: "",
      admissionDate: new Date().toISOString().split("T")[0],
      major: "Software Engineer",
      curriculum: curriculums.length > 0 ? curriculums[0] : ""
    })
    setErrors({})
    setSuccessMsg(null)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrors({})
    setSuccessMsg(null)

    try {
      const data = await file.arrayBuffer()
      const workbook = xlsx.read(data)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = xlsx.utils.sheet_to_json<any>(worksheet, {
        raw: false,
        dateNF: "m/d/yyyy"
      })

      const validParsedRows: AddedStudent[] = []
      const fileEmails = new Set<string>()

      jsonData.forEach((row) => {
        // Handle different column names flexibly
        const email = row["Email"] || row["email"] || ""
        const fullName =
          row["FullName"] ||
          row["Full Name"] ||
          row["fullName"] ||
          row["name"] ||
          ""
        const rawDate =
          row["Admission Date"] || row["admissionDate"] || row["Date"] || ""
        const major = row["Major"] || row["major"] || "Software Engineer"
        const curriculum = row["Curriculum"] || row["curriculum"] || ""

        let parsedDate = new Date().toISOString().split("T")[0]
        const dateStr = String(rawDate).trim()
        if (dateStr) {
          if (dateStr.includes("/")) {
            const parts = dateStr.split("/")
            if (parts.length === 3) {
              const m = parts[0].padStart(2, "0")
              const d = parts[1].padStart(2, "0")
              const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2]
              parsedDate = `${y}-${m}-${d}`
            }
          } else if (dateStr.includes("-")) {
            parsedDate = dateStr
          } else {
            const dObj = new Date(dateStr)
            if (!isNaN(dObj.getTime())) {
              parsedDate = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, "0")}-${String(dObj.getDate()).padStart(2, "0")}`
            }
          }
        }

        if (
          email &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email)) &&
          fullName &&
          major &&
          curriculum
        ) {
          const emailStr = String(email).trim().toLowerCase()
          // 1. Check duplicate within the Excel file itself
          if (!fileEmails.has(emailStr)) {
            fileEmails.add(emailStr)
            validParsedRows.push({
              id: crypto.randomUUID(),
              email: String(email).trim(),
              fullName: String(fullName).trim(),
              admissionDate: parsedDate,
              major: String(major).trim(),
              curriculum: String(curriculum).trim(),
              addedAt: new Date().toLocaleString("vi-VN")
            })
          }
        }
      })

      // 2. Filter out emails that already exist in the Draft list (addedStudents)
      const nonDraftRows = validParsedRows.filter(
        (row) =>
          !addedStudents.some(
            (s) => s.email.toLowerCase() === row.email.toLowerCase()
          )
      )

      // 3. Check against the Backend Database
      const checkResults = await Promise.all(
        nonDraftRows.map(async (row) => {
          try {
            const existsInDb = await counselorApi.checkStudentEmail(row.email)
            return { row, exists: existsInDb }
          } catch {
            return { row, exists: true } // Skip if API fails
          }
        })
      )

      const newDrafts = checkResults
        .filter((res) => !res.exists)
        .map((res) => res.row)
      const skippedCount = jsonData.length - newDrafts.length

      if (newDrafts.length > 0) {
        setAddedStudents((prev) => [...newDrafts, ...prev])
        setSuccessMsg(
          `Imported ${newDrafts.length} new students. ${
            skippedCount > 0
              ? `(${skippedCount} skipped due to duplicates/errors)`
              : ""
          }`
        )
        setErrors({})
      } else {
        setErrors({
          general:
            "No valid new students found. They might be duplicates or missing required columns."
        })
        setSuccessMsg(null)
      }
    } catch (err) {
      setErrors({ general: "Failed to parse the Excel file." })
      setSuccessMsg(null)
    } finally {
      setIsImportModalOpen(false)
      // reset file input if needed
      e.target.value = ""
    }
  }

  const handleSubmitAllToSystem = async () => {
    if (addedStudents.length === 0) return

    setIsSubmitting(true)
    setErrors({})
    setSuccessMsg(null)

    try {
      const payload = addedStudents.map((s) => ({
        email: s.email,
        fullName: s.fullName,
        admissionDate: s.admissionDate,
        major: s.major,
        curriculum: s.curriculum
      }))

      const blob = await counselorApi.importStudents(payload)

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute(
        "download",
        `Student_Accounts_${new Date().toISOString().split("T")[0]}.xlsx`
      )
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)

      setSuccessMsg(
        `Successfully imported ${addedStudents.length} students to the system!`
      )
      setAddedStudents([]) // Clear drafts after success
    } catch (err: any) {
      setErrors({
        general:
          err?.response?.data?.message ||
          "Failed to submit students to the system. Please try again."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    user,
    form,
    errors,
    isSubmitting,
    isImportModalOpen,
    successMsg,
    addedStudents,
    editingDraftId,
    curriculums,
    setIsImportModalOpen,
    handleChange,
    handleSubmit,
    handleLogout,
    handleDeleteDraft,
    handleEditDraft,
    cancelEdit,
    handleFileUpload,
    handleSubmitAllToSystem
  }
}
