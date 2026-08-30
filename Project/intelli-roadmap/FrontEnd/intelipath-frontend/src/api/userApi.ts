import { ENDPOINTS, mainClient } from '@/shared/api'

const userApi = {
  getMe: async () => {
    return await mainClient.get(ENDPOINTS.USERS.ME)
  }
}

export default userApi
