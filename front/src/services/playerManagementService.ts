import { api } from './api'

// Types
export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  userType: 'admin' | 'team_manager' | 'user'
  companyId: string
  teamId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  auth0UserId: string
}

export interface UserCreateRequest {
  email: string
  firstName: string
  lastName: string
  userType: 'admin' | 'team_manager' | 'user'
  companyId?: string
  teamId?: string
}

export interface UserUpdateRequest {
  firstName?: string
  lastName?: string
  userType?: 'admin' | 'team_manager' | 'user'
  companyId?: string
  teamId?: string
  isActive?: boolean
}

export interface Company {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface CompanyCreateRequest {
  name: string
  description?: string
}

export interface Team {
  id: string
  name: string
  description?: string
  companyId: string
  managerId?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  memberCount?: number
  managerName?: string
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  joinedAt: string
  user?: User
}

export interface Lesson {
  id: string
  campaignId: string
  name: string
  title: string
  description?: string
  content?: string
  duration?: number
  points: number
  maxPoints: number
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface LessonCreateRequest {
  campaignId: string
  name: string
  title: string
  description?: string
  content?: string
  points: number
  maxPoints: number
  order: number
}

export interface LessonDocument {
  id: string
  lessonId: string
  title: string
  description?: string
  fileName: string
  fileType: string
  fileSize: number
  s3Key: string
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface UserProgress {
  id: string
  userId: string
  lessonId?: string
  teamId?: string
  points: number
  maxPoints: number
  notes?: string
  assignedBy?: string
  completedLessons?: number
  totalPoints?: number
  createdAt: string
  updatedAt: string
  lastActivity?: string
}

export interface UserProgressDetail {
  id: string
  lessonId: string
  lessonTitle: string
  lessonName: string
  pointsEarned: number
  maxPoints: number
  completedAt: string
  assignedBy?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface UserProgressDetailsResponse {
  userId: string
  userEmail: string
  userFirstName: string
  userLastName: string
  campaignId: string
  summary: {
    totalPoints: number
    totalMaxPoints: number
    completedLessons: number
    averageScore: number
  }
  progressDetails: UserProgressDetail[]
}

export interface Campaign {
  id: string
  name: string
  description?: string
  companyId: string
  isActive: boolean
  status: 'draft' | 'active' | 'completed' | 'archived'
  startDate?: string
  endDate?: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface CampaignCreateRequest {
  name: string
  description?: string
  companyId: string
  status?: 'draft' | 'active' | 'completed' | 'archived'
  startDate?: string
  endDate?: string
}

export interface CampaignUpdateRequest {
  name?: string
  description?: string
  status?: 'draft' | 'active' | 'completed' | 'archived'
  startDate?: string
  endDate?: string
  isActive?: boolean
}

export interface Document {
  id: string
  name: string
  fileName: string
  fileType: string
  fileSize: number
  s3Key: string
  createdAt: string
  updatedAt: string
}

// API Service Class
class PlayerManagementService {
  private baseUrl = '/api'

  // User Management
  async getCurrentUser() {
    const response = await api.get(`${this.baseUrl}/user/me`)
    return response.data
  }

  async getUsers(params?: { companyId?: string }) {
    const response = await api.get(`${this.baseUrl}/users`, { params })
    return response.data
  }

  async getUser(userId: string) {
    const response = await api.get(`${this.baseUrl}/users/${userId}`)
    return response.data
  }

  async createUser(userData: UserCreateRequest) {
    const response = await api.post<User>(`${this.baseUrl}/users`, userData)
    return response.data
  }

  async updateUser(userId: string, userData: UserUpdateRequest) {
    const response = await api.put<User>(`${this.baseUrl}/users/${userId}`, userData)
    return response.data
  }

  async deleteUser(userId: string) {
    await api.delete<void>(`${this.baseUrl}/users/${userId}`)
  }

  // Company Management
  async getCompanies() {
    const response = await api.get(`${this.baseUrl}/companies`)
    return response.data
  }

  async createCompany(companyData: CompanyCreateRequest) {
    const response = await api.post<Company>(`${this.baseUrl}/companies`, companyData)
    return response.data
  }

  async updateCompany(companyId: string, companyData: Partial<CompanyCreateRequest>) {
    const response = await api.put<Company>(`${this.baseUrl}/companies/${companyId}`, companyData)
    return response.data
  }

  async deleteCompany(companyId: string) {
    await api.delete<void>(`${this.baseUrl}/companies/${companyId}`)
  }

  // Team Management
  async getTeams(params?: { companyId?: string }) {
    const response = await api.get(`${this.baseUrl}/teams`, { params })
    return response.data
  }

  async getTeam(teamId: string) {
    const response = await api.get(`${this.baseUrl}/teams/${teamId}`)
    return response.data
  }

  async getManagedTeams() {
    const response = await api.get(`${this.baseUrl}/teams/managed`)
    return response.data
  }

  async createTeam(teamData: Partial<Team>) {
    const response = await api.post<Team>(`${this.baseUrl}/teams`, teamData)
    return response.data
  }

  async updateTeam(teamId: string, teamData: Partial<Team>) {
    const response = await api.put<Team>(`${this.baseUrl}/teams/${teamId}`, teamData)
    return response.data
  }

  async deleteTeam(teamId: string) {
    await api.delete<void>(`${this.baseUrl}/teams/${teamId}`)
  }

  // Team Member Management
  async getTeamMembers(teamId: string) {
    const response = await api.get(`${this.baseUrl}/teams/${teamId}/members`)
    return response.data
  }

  async addTeamMember(memberData: { teamId: string; userId: string }) {
    const response = await api.post<TeamMember>(`${this.baseUrl}/teams/${memberData.teamId}/members`, {
      userId: memberData.userId
    })
    return response.data
  }

  async removeTeamMember(teamId: string, userId: string) {
    await api.delete<void>(`${this.baseUrl}/teams/${teamId}/members/${userId}`)
  }

  // Lesson Management
  async getLessons(campaignId?: string) {
    const params = campaignId ? { campaignId } : {}
    const response = await api.get(`${this.baseUrl}/lessons`, { params })
    return response.data
  }

  async getLesson(lessonId: string) {
    const response = await api.get(`${this.baseUrl}/lessons/${lessonId}`)
    return response.data
  }

  async createLesson(lessonData: LessonCreateRequest) {
    const response = await api.post<Lesson>(`${this.baseUrl}/lessons`, lessonData)
    return response.data
  }

  async updateLesson(lessonId: string, lessonData: Partial<Lesson>) {
    const response = await api.put<Lesson>(`${this.baseUrl}/lessons/${lessonId}`, lessonData)
    return response.data
  }

  // Lesson Document Management
  async getLessonDocuments(lessonId: string) {
    const response = await api.get(`${this.baseUrl}/lessons/${lessonId}/documents`)
    return response.data
  }

  async createLessonDocument(documentData: Partial<LessonDocument>) {
    const response = await api.post<LessonDocument>(`${this.baseUrl}/lesson-documents`, documentData)
    return response.data
  }

  async downloadLessonDocument(documentId: string) {
    const response = await api.get(`${this.baseUrl}/lesson-documents/${documentId}/download`)
    return response.data
  }

  // Progress Management
  async getUserProgress(userId: string) {
    const response = await api.get(`${this.baseUrl}/users/${userId}/progress`)
    return response.data
  }

  async getLessonProgress(userId: string, lessonId: string) {
    const response = await api.get(`${this.baseUrl}/users/${userId}/lessons/${lessonId}/progress`)
    return response.data
  }

  async updateProgress(progressData: {
    userId: string
    lessonId?: string
    progress?: number
    completed?: boolean
  }) {
    const response = await api.put<UserProgress>(`${this.baseUrl}/user-progress`, progressData)
    return response.data
  }

  // Team Manager Functions
  async assignLessonPoints(pointsData: {
    userId: string
    lessonId: string
    campaignId: string
    pointsEarned: number
    maxPoints: number
    notes?: string
  }) {
    const response = await api.post<UserProgress>(`${this.baseUrl}/team-manager/assign-points`, pointsData)
    return response.data
  }

  async getTeamLessonProgress(teamId: string, userId?: string, campaignId?: string) {
    const params = {
      userId: userId,
      campaignId: campaignId
    }
    const response = await api.get(`${this.baseUrl}/team-manager/teams/${teamId}/progress`, { params })
    return response.data
  }

  async getUserProgressDetails(userId: string, campaignId: string) {
    const params = { campaignId }
    const response = await api.get(`${this.baseUrl}/team-manager/users/${userId}/progress-details`, { params })
    return response.data
  }

  // Campaign Management
  async getCampaigns() {
    const response = await api.get(`${this.baseUrl}/campaigns`)
    return response.data
  }

  async createCampaign(campaignData: CampaignCreateRequest) {
    const response = await api.post<Campaign>(`${this.baseUrl}/campaigns`, campaignData)
    return response.data
  }

  async updateCampaign(campaignId: string, campaignData: CampaignUpdateRequest) {
    const response = await api.put<Campaign>(`${this.baseUrl}/campaigns/${campaignId}`, campaignData)
    return response.data
  }

  async deleteCampaign(campaignId: string) {
    await api.delete<void>(`${this.baseUrl}/campaigns/${campaignId}`)
  }

  // Document Management
  async getDocuments() {
    const response = await api.get(`${this.baseUrl}/documents`)
    return response.data
  }

  async createDocument(documentData: Partial<Document>) {
    const response = await api.post<Document>(`${this.baseUrl}/documents`, documentData)
    return response.data
  }

  // File Upload
  async getPresignedUrl(fileName: string, fileType: string) {
    const response = await api.post<{
      uploadUrl: string
      s3Key: string
    }>(`${this.baseUrl}/presigned-url`, {
      fileName,
      fileType
    })
    return response.data
  }

  async uploadFile(file: File, uploadUrl: string): Promise<void> {
    await api.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type
      }
    })
  }

  // Analytics & Reporting
  async getRecentActivities(userId: string) {
    const response = await api.get(`${this.baseUrl}/users/${userId}/activities`)
    return response.data
  }

  async getUserDashboard() {
    const response = await api.get(`${this.baseUrl}/user/dashboard`)
    return response.data
  }

  // Team Analytics
  async getTeamStats(teamId: string) {
    const response = await api.get(`${this.baseUrl}/teams/${teamId}/stats`)
    return response.data
  }

  async getCompanyStats(companyId: string) {
    const response = await api.get(`${this.baseUrl}/companies/${companyId}/stats`)
    return response.data
  }
}

// Export singleton instance
export const playerManagementService = new PlayerManagementService()
export default PlayerManagementService