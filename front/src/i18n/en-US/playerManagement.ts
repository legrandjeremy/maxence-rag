export default {
  // Dashboard translations
  dashboard: {
    title: 'MY DASHBOARD',
    loading: 'Loading your dashboard...',
    loadError: 'Failed to load dashboard data',
    welcome: 'Welcome, {firstName} {lastName}!',
    totalPoints: 'Total Points',
    campaigns: 'Campaigns',
    progress: 'Progress',
    points: 'Points',
    pts: 'pts',
    completed: 'Completed',
    lessons: 'Lessons',
    lessonOrder: 'Lesson',
    documents: 'Documents',
    campaignDocuments: 'Campaign Documents',
    noCampaigns: 'No campaigns available',
    noCampaignsDesc: 'You are not currently enrolled in any campaigns. Contact your administrator.',
    downloadNotImplemented: 'Download for "{name}" is not yet implemented'
  },

  // Player Dashboard translations
  player: {
    dashboard: {
      welcome: 'Welcome, {name}!',
      subtitle: 'Track your learning progress and achievements',
      lessonsCompleted: 'Lessons Completed',
      totalPoints: 'Total Points',
      overallProgress: 'Overall Progress',
      selectContext: 'Select Learning Context',
      selectCompany: 'Select Company',
      selectCampaign: 'Select Campaign',
      noCompaniesAvailable: 'No companies available',
      noCampaignsAvailable: 'No campaigns available',
      selectCompanyFirst: 'Please select a company first',
      selectCampaignToStart: 'Select a Campaign to Start Learning',
      selectCampaignDesc: 'Choose a company and campaign to view available lessons',
      availableLessons: 'Available Lessons',
      noLessons: 'No Lessons Available',
      noLessonsDesc: 'New lessons will appear here when they become available',
      minutes: 'min',
      points: 'pts',
      documents: 'Documents',
      lessonDocuments: 'Lesson Documents',
      noDocuments: 'No documents available for this lesson'
    }
  },

  // Admin translations
  admin: {
    companies: {
      title: 'Company Management',
      create: 'Create Company',
      edit: 'Edit Company',
      name: 'Company Name',
      description: 'Description',
      status: 'Status',
      createdAt: 'Created At',
      confirmDelete: 'Confirm Deletion',
      deleteWarning: 'Are you sure you want to delete the company "{name}"? This action cannot be undone.',
      createSuccess: 'Company created successfully',
      updateSuccess: 'Company updated successfully',
      deleteSuccess: 'Company deleted successfully',
      loadError: 'Failed to load companies',
      saveError: 'Failed to save company',
      deleteError: 'Failed to delete company',
      updateNotImplemented: 'Company update is not yet implemented'
    },
    campaigns: {
      title: 'Campaign Management',
      subtitle: 'Manage learning campaigns and programs',
      create: 'Create Campaign',
      createCampaign: 'Create Campaign',
      edit: 'Edit Campaign',
      editCampaign: 'Edit Campaign',
      name: 'Campaign Name',
      description: 'Description',
      company: 'Company',
      startDate: 'Start Date',
      endDate: 'End Date',
      createdAt: 'Created At',
      confirmDelete: 'Confirm Deletion',
      deleteConfirm: 'Are you sure you want to delete {name}?',
      deleteWarning: 'Are you sure you want to delete the campaign "{name}"? This action cannot be undone.',
      createSuccess: 'Campaign created successfully',
      updateSuccess: 'Campaign updated successfully',
      updateNotImplemented: 'Update functionality not yet implemented',
      deleteNotImplemented: 'Delete functionality not yet implemented',
      deleteSuccess: 'Campaign deleted successfully',
      loadError: 'Failed to load campaigns',
      saveError: 'Failed to save campaign',
      deleteError: 'Failed to delete campaign',
      form: {
        title: 'Campaign Title',
        description: 'Description',
        company: 'Company',
        startDate: 'Start Date',
        endDate: 'End Date',
        status: 'Status'
      },
      status: {
        draft: 'Draft',
        active: 'Active',
        completed: 'Completed',
        archived: 'Archived'
      },
      errors: {
        loadFailed: 'Failed to load campaigns',
        saveFailed: 'Failed to save campaign'
      }
    },
    users: {
      title: 'User Management',
      create: 'Create User',
      edit: 'Edit User',
      viewUser: 'View User Details',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      userType: 'User Type',
      company: 'Company',
      teamManager: 'Team Manager',
      status: 'Status',
      isActive: 'Active Status',
      createdAt: 'Created At',
      emailHint: 'This email must match an Auth0 user account',
      emailReadonlyHint: 'Email cannot be changed after user creation',
      companyHint: 'Optional - leave empty for system-wide users',
      teamManagerHint: 'Select a team manager for this user (only for user type)',
      selectCompanyFirst: 'Select a Company to View Users',
      selectCompanyHint: 'Please select a company from the filter above to view and manage users',
      selectCompanyToCreate: 'Please select a company first to create a user',
      userTypes: {
        admin: 'Administrator',
        team_manager: 'Team Manager',
        user: 'User'
      },
      confirmDelete: 'Confirm User Deletion',
      deleteWarning: 'Are you sure you want to delete the user "{name}"? Choose deletion type below.',
      softDelete: 'Soft Delete (Deactivate user)',
      hardDelete: 'Hard Delete (Permanently remove from database)',
      createSuccess: 'User created successfully',
      updateSuccess: 'User updated successfully',
      deleteSuccess: 'User deleted successfully',
      loadError: 'Failed to load users',
      saveError: 'Failed to save user',
      deleteError: 'Failed to delete user'
    }
  },

  // Common translations
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    close: 'Close',
    actions: 'Actions',
    active: 'Active',
    inactive: 'Inactive',
    retry: 'Retry',
    loading: 'Loading...',
    noData: 'No data available',
    search: 'Search',
    filter: 'Filter',
    all: 'All'
  },

  // Validation translations
  validation: {
    required: 'This field is required',
    email: 'Please enter a valid email address',
    minLength: 'Minimum {min} characters required',
    maxLength: 'Maximum {max} characters allowed',
    positiveNumber: 'Please enter a positive number',
    nonNegativeNumber: 'Please enter a non-negative number'
  },

  // Lessons
  lessons: {
    title: 'Lesson Management',
    subtitle: 'Manage lessons and learning content',
    createLesson: 'Create Lesson',
    editLesson: 'Edit Lesson',
    selectCampaign: 'Select Campaign',
    selectCampaignFirst: 'Please select a campaign to manage lessons',
    deleteConfirm: 'Are you sure you want to delete {name}?',
    createSuccess: 'Lesson created successfully',
    updateNotImplemented: 'Update functionality not yet implemented',
    deleteNotImplemented: 'Delete functionality not yet implemented',
    form: {
      title: 'Lesson Title',
      description: 'Description',
      order: 'Order',
      maxPoints: 'Maximum Points',
      content: 'Content'
    },
    errors: {
      loadFailed: 'Failed to load lessons',
      saveFailed: 'Failed to save lesson'
    }
  },

  // Documents
  documents: {
    title: 'Document Management',
    subtitle: 'Manage documents and resources',
    createDocument: 'Create Document',
    editDocument: 'Edit Document',
    uploadDocument: 'Upload Document',
    downloadDocument: 'Download',
    deleteConfirm: 'Are you sure you want to delete {name}?',
    createSuccess: 'Document created successfully',
    updateNotImplemented: 'Update functionality not yet implemented',
    deleteNotImplemented: 'Delete functionality not yet implemented',
    form: {
      title: 'Document Title',
      description: 'Description',
      fileName: 'File Name',
      fileType: 'File Type',
      campaign: 'Campaign',
      lesson: 'Lesson'
    },
    errors: {
      loadFailed: 'Failed to load documents',
      saveFailed: 'Failed to save document'
    }
  },

  // Team Manager translations
  teamManager: {
    dashboard: {
      title: 'Team Manager Dashboard',
      subtitle: 'Manage your teams and track their progress',
      totalPoints: 'Total Points',
      completedLessons: 'Completed Lessons',
      selectCompany: 'Select Company',
      selectCampaign: 'Select Campaign',
      noCompanies: 'No companies available',
      noCampaigns: 'No campaigns available',
      noTeams: 'No teams to manage',
      selectCompanyAndCampaign: 'Please select a company and campaign to view team data',
      teamProgress: 'Team Progress',
      memberProgress: 'Member Progress',
      assignPoints: 'Assign Points',
      viewDetails: 'View Details',
      refreshData: 'Refresh Data',
      loading: 'Loading...',
      loadError: 'Failed to load data',
      assignSuccess: 'Points assigned successfully',
      assignError: 'Failed to assign points',
      lessonNotFound: 'Lesson not found'
    }
  },

  // Navigation
  navigation: {
    dashboard: 'Dashboard',
    admin: 'Administration',
    companies: 'Companies',
    campaigns: 'Campaigns',
    users: 'Users',
    profile: 'Profile',
    logout: 'Logout',
    teamManagerDashboard: 'Team Manager Dashboard'
  },

  // Player-facing campaign translations
  campaigns: {
    // Campaign List/Overview
    title: 'My Learning Campaigns',
    subtitle: 'Track your progress across all assigned campaigns',
    noCampaigns: 'No campaigns available',
    noCampaignsDesc: 'You are not currently enrolled in any campaigns. Contact your administrator to get started.',
    loading: 'Loading your campaigns...',
    loadError: 'Failed to load campaigns',
    retry: 'Retry',
    
    // Campaign Card/Item
    card: {
      title: 'Campaign',
      company: 'Company',
      progress: 'Progress',
      status: 'Status',
      lessons: 'Lessons',
      points: 'Points',
      startDate: 'Start Date',
      endDate: 'End Date',
      duration: 'Duration',
      difficulty: 'Difficulty',
      category: 'Category',
      description: 'Description',
      
      // Progress States
      notStarted: 'Not Started',
      inProgress: 'In Progress',
      completed: 'Completed',
      paused: 'Paused',
      expired: 'Expired',
      
      // Progress Details
      completedLessons: '{completed} of {total} lessons',
      earnedPoints: '{earned} of {total} points',
      completionRate: '{percentage}% complete',
      timeRemaining: '{days} days remaining',
      timeElapsed: '{days} days since start',
      
      // Actions
      startCampaign: 'Start Campaign',
      continueCampaign: 'Continue Learning',
      resumeCampaign: 'Resume',
      reviewCampaign: 'Review',
      viewDetails: 'View Details',
      viewCertificate: 'View Certificate',
      retakeCampaign: 'Retake Campaign'
    },
    
    // Campaign Details View
    details: {
      title: 'Campaign Details',
      overview: 'Overview',
      progress: 'My Progress',
      lessons: 'Lessons',
      documents: 'Resources',
      achievements: 'Achievements',
      leaderboard: 'Leaderboard',
      
      // Campaign Information
      campaignInfo: 'Campaign Information',
      learningObjectives: 'Learning Objectives',
      prerequisites: 'Prerequisites',
      estimatedTime: 'Estimated Time',
      completionCriteria: 'Completion Criteria',
      
      // Progress Section
      overallProgress: 'Overall Progress',
      lessonsProgress: 'Lessons Progress',
      pointsProgress: 'Points Progress',
      timeSpent: 'Time Spent',
      lastActivity: 'Last Activity',
      startedOn: 'Started On',
      expectedCompletion: 'Expected Completion',
      
      // Statistics
      averageScore: 'Average Score',
      bestScore: 'Best Score',
      totalAttempts: 'Total Attempts',
      streak: 'Learning Streak',
      rank: 'My Rank',
      
      // Messages
      notStartedMessage: 'You haven\'t started this campaign yet.',
      completedMessage: 'Congratulations! You have completed this campaign.',
      inProgressMessage: 'Keep up the great work! You\'re making excellent progress.',
      pausedMessage: 'This campaign is currently paused. Contact your administrator.',
      expiredMessage: 'This campaign has expired. Some features may be limited.'
    },
    
    // Campaign Actions
    actions: {
      start: 'Start Campaign',
      continue: 'Continue',
      pause: 'Pause',
      resume: 'Resume',
      restart: 'Restart',
      complete: 'Mark as Complete',
      review: 'Review',
      bookmark: 'Bookmark',
      share: 'Share Progress',
      exportProgress: 'Export Progress',
      downloadCertificate: 'Download Certificate',
      
      // Confirmations
      confirmStart: 'Are you ready to start this campaign?',
      confirmPause: 'Are you sure you want to pause this campaign?',
      confirmRestart: 'Are you sure you want to restart this campaign? Your current progress will be lost.',
      confirmComplete: 'Mark this campaign as complete?',
      
      // Results
      startSuccess: 'Campaign started successfully!',
      pauseSuccess: 'Campaign paused.',
      resumeSuccess: 'Campaign resumed.',
      restartSuccess: 'Campaign restarted.',
      completeSuccess: 'Campaign marked as complete!',
      
      // Errors
      startError: 'Failed to start campaign',
      pauseError: 'Failed to pause campaign',
      resumeError: 'Failed to resume campaign',
      restartError: 'Failed to restart campaign',
      completeError: 'Failed to complete campaign'
    },
    
    // Filtering and Sorting
    filters: {
      title: 'Filter Campaigns',
      all: 'All Campaigns',
      active: 'Active',
      completed: 'Completed',
      notStarted: 'Not Started',
      inProgress: 'In Progress',
      paused: 'Paused',
      expired: 'Expired',
      
      // Sort Options
      sortBy: 'Sort by',
      sortByDate: 'Date',
      sortByProgress: 'Progress',
      sortByName: 'Name',
      sortByCompany: 'Company',
      sortByPriority: 'Priority',
      
      // Sort Direction
      ascending: 'Ascending',
      descending: 'Descending',
      
      // Search
      searchPlaceholder: 'Search campaigns...',
      noResults: 'No campaigns match your filters',
      clearFilters: 'Clear Filters'
    },
    
    // Campaign Status Messages
    status: {
      upcoming: 'Upcoming',
      active: 'Active',
      completed: 'Completed',
      expired: 'Expired',
      paused: 'Paused',
      cancelled: 'Cancelled',
      draft: 'Draft'
    },
    
    // Notifications
    notifications: {
      newCampaign: 'New campaign assigned: {campaignName}',
      campaignStarted: 'Campaign started: {campaignName}',
      campaignCompleted: 'Campaign completed: {campaignName}',
      deadlineApproaching: 'Campaign deadline approaching: {campaignName}',
      campaignExpired: 'Campaign expired: {campaignName}',
      progressUpdate: 'Progress updated for: {campaignName}',
      certificateAvailable: 'Certificate available for: {campaignName}'
    }
  }
} 