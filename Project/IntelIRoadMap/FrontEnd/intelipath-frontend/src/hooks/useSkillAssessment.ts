import { useEffect, useState } from "react"
import skillApi from "../api/skillApi"
import { useAuth } from "../context/AuthContext"

export interface Skill {
  skillId: string
  skillName: string
  category?: string
}

const normalizeSkills = (data: unknown): Skill[] => {
  if (Array.isArray(data)) return data as Skill[]
  if (
    data &&
    typeof data === "object" &&
    "skills" in data &&
    Array.isArray((data as { skills: unknown }).skills)
  ) {
    return (data as { skills: Skill[] }).skills
  }
  return []
}

export function useSkillAssessment(isOpen: boolean, onClose: () => void) {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [skills, setSkills] = useState<Skill[]>([])
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    let isMounted = true

    const fetchSkills = async () => {
      setIsLoading(true)
      try {
        const res = await skillApi.getSkills()
        if (isMounted) {
          // Original: setSkills(res.skills)
          // setSkills((res as any).skills || res.data?.data || res.data || [])
          setSkills((res as any).data?.data || (res as any).data || [])
        }
      } catch (error) {
        console.error("Error to get list of skills:", error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchSkills()

    return () => {
      isMounted = false
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const trimmedQuery = searchQuery.trim()
    if (!trimmedQuery) return

    let isMounted = true
    const filterSkills = async () => {
      setIsLoading(true)
      try {
        const res = await skillApi.searchSkills(trimmedQuery)
        if (isMounted) {
          // Original: setSkills(res)
          // setSkills(res as any)
          setSkills((res as any).data?.data || (res as any).data || [])
        }
      } catch (error) {
        console.error("Error to filter skill:", error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    filterSkills()

    return () => {
      isMounted = false
    }
  }, [isOpen, searchQuery])

  const toggleSkill = (skillId: string) => {
    setSelectedSkillIds((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId]
    )
  }

  const handleSave = async () => {
    if (selectedSkillIds.length === 0) {
      onClose()
      return
    }

    setIsSaving(true)
    try {
      // Original: await skillApi.selectSkills(selectedSkillIds)
      await skillApi.selectSkills({ skillIds: selectedSkillIds })
      onClose()
    } catch (error) {
      console.error("Error to save skills:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return {
    user,
    searchQuery,
    setSearchQuery,
    skills,
    selectedSkillIds,
    isSaving,
    isLoading,
    toggleSkill,
    handleSave
  }
}
