import { MyStudent } from "./counselorDashboard.types"

export interface Feedback {
  feedbackId: string
  senderId: string
  receiverId: string
  senderName: string
  receiverName: string
  content: string
  type: "GENERAL" | "SKILL" | "CAREER"
  attachments?: {
    attachmentId: string
    fileName: string
    fileType: string
    fileSize: number
  }[]
  createdAt: string
  updatedAt: string
}

export interface FeedbackListResponse {
  feedbacks: Feedback[]
}

export interface CreateFeedback {
  receiverId: string
  content: string
  type: "GENERAL" | "SKILL" | "CAREER"
  attachments?: File[]
}

export interface PaginatedStudentResponse {
  totalPages: number
  currentPage: number
  careers: string[]
  students: MyStudent[]
}
