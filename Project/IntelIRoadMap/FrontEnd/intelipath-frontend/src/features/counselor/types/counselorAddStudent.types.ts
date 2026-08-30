export interface AddStudentForm {
  email: string
  fullName: string
  admissionDate: string
  major: string
  curriculum: string
}

export interface AddedStudent {
  id: string
  email: string
  fullName: string
  admissionDate: string
  major: string
  curriculum: string
  addedAt: string
}

export interface FormErrors {
  username?: string
  email?: string
  fullName?: string
  admissionDate?: string
  major?: string
  curriculum?: string
  general?: string
}

// Payload sent to BE when importing student accounts (matches ImportStudentAccountsRequest.java)
export interface ImportStudentAccount {
  fullName: string
  email: string
  admissionDate: string // "yyyy-MM-dd" format required by BE LocalDate
  major: string
  curriculum: string
}
