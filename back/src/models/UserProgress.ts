export interface UserProgress {
  id: string;
  userId: string;
  lessonId: string;
  campaignId: string;
  pointsEarned: number;
  maxPoints: number; // Maximum points available for this lesson
  completedAt: string;
  assignedBy?: string; // Team Manager who assigned the points (optional)
  teamId?: string; // Team context for the progress
  notes?: string; // Notes from team manager
  createdAt: string;
  updatedAt: string;
}

export interface UserProgressCreateRequest {
  userId: string;
  lessonId: string;
  campaignId: string;
  pointsEarned: number;
  maxPoints: number;
  assignedBy?: string;
  teamId?: string;
  notes?: string;
}

export interface UserProgressUpdateRequest {
  pointsEarned?: number;
  notes?: string;
  assignedBy?: string;
}

export interface UserCampaignStats {
  userId: string;
  campaignId: string;
  totalPoints: number;
  completedLessons: number;
  totalLessons: number;
  lastActivity: string;
  teamId?: string;
  teamName?: string;
}

export interface TeamManagerDashboard {
  teamManagerId: string;
  teamId: string;
  teamName: string;
  users: UserCampaignStats[];
  totalTeamPoints: number;
  averageCompletion: number;
}

export interface TeamLessonProgress {
  lessonId: string;
  lessonName: string;
  campaignId: string;
  campaignName: string;
  teamId: string;
  userProgresses: {
    userId: string;
    userName: string;
    pointsEarned: number;
    maxPoints: number;
    completedAt?: string;
    assignedBy?: string;
    notes?: string;
  }[];
  averageScore: number;
  completionRate: number;
} 