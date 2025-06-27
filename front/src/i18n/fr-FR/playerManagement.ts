export default {
  // Dashboard translations
  dashboard: {
    title: 'MON TABLEAU DE BORD',
    loading: 'Chargement de votre tableau de bord...',
    loadError: 'Échec du chargement des données du tableau de bord',
    welcome: 'Bienvenue, {firstName} {lastName} !',
    totalPoints: 'Points Totaux',
    campaigns: 'Campagnes',
    progress: 'Progression',
    points: 'Points',
    pts: 'pts',
    completed: 'Terminé',
    lessons: 'Leçons',
    lessonOrder: 'Leçon',
    documents: 'Documents',
    campaignDocuments: 'Documents de Campagne',
    noCampaigns: 'Aucune campagne disponible',
    noCampaignsDesc: 'Vous n\'êtes actuellement inscrit à aucune campagne. Contactez votre administrateur.',
    downloadNotImplemented: 'Le téléchargement de "{name}" n\'est pas encore implémenté'
  },

  // Player Dashboard translations
  player: {
    dashboard: {
      welcome: 'Bienvenue, {name} !',
      subtitle: 'Suivez vos progrès d\'apprentissage et vos réalisations',
      lessonsCompleted: 'Leçons Terminées',
      totalPoints: 'Points Totaux',
      overallProgress: 'Progression Globale',
      selectContext: 'Sélectionner le Contexte d\'Apprentissage',
      selectCompany: 'Sélectionner une Entreprise',
      selectCampaign: 'Sélectionner une Campagne',
      noCompaniesAvailable: 'Aucune entreprise disponible',
      noCampaignsAvailable: 'Aucune campagne disponible',
      selectCompanyFirst: 'Veuillez d\'abord sélectionner une entreprise',
      selectCampaignToStart: 'Sélectionnez une Campagne pour Commencer l\'Apprentissage',
      selectCampaignDesc: 'Choisissez une entreprise et une campagne pour voir les leçons disponibles',
      availableLessons: 'Leçons Disponibles',
      noLessons: 'Aucune Leçon Disponible',
      noLessonsDesc: 'De nouvelles leçons apparaîtront ici lorsqu\'elles seront disponibles',
      minutes: 'min',
      points: 'pts',
      documents: 'Documents',
      lessonDocuments: 'Documents de Leçon',
      noDocuments: 'Aucun document disponible pour cette leçon'
    }
  },

  // Admin translations
  admin: {
    companies: {
      title: 'Gestion des Entreprises',
      create: 'Créer une Entreprise',
      edit: 'Modifier l\'Entreprise',
      name: 'Nom de l\'Entreprise',
      description: 'Description',
      status: 'Statut',
      createdAt: 'Créé le',
      confirmDelete: 'Confirmer la Suppression',
      deleteWarning: 'Êtes-vous sûr de vouloir supprimer l\'entreprise "{name}" ? Cette action ne peut pas être annulée.',
      createSuccess: 'Entreprise créée avec succès',
      updateSuccess: 'Entreprise mise à jour avec succès',
      deleteSuccess: 'Entreprise supprimée avec succès',
      loadError: 'Échec du chargement des entreprises',
      saveError: 'Échec de la sauvegarde de l\'entreprise',
      deleteError: 'Échec de la suppression de l\'entreprise',
      updateNotImplemented: 'La mise à jour d\'entreprise n\'est pas encore implémentée'
    },
    campaigns: {
      title: 'Gestion des Campagnes',
      subtitle: 'Gérer les campagnes et programmes d\'apprentissage',
      create: 'Créer une Campagne',
      createCampaign: 'Créer une Campagne',
      edit: 'Modifier la Campagne',
      editCampaign: 'Modifier la Campagne',
      name: 'Nom de la Campagne',
      description: 'Description',
      company: 'Entreprise',
      startDate: 'Date de Début',
      endDate: 'Date de Fin',
      createdAt: 'Créé le',
      confirmDelete: 'Confirmer la Suppression',
      deleteConfirm: 'Êtes-vous sûr de vouloir supprimer {name} ?',
      deleteWarning: 'Êtes-vous sûr de vouloir supprimer la campagne "{name}" ? Cette action ne peut pas être annulée.',
      createSuccess: 'Campagne créée avec succès',
      updateSuccess: 'Campagne mise à jour avec succès',
      updateNotImplemented: 'Fonctionnalité de mise à jour pas encore implémentée',
      deleteNotImplemented: 'Fonctionnalité de suppression pas encore implémentée',
      deleteSuccess: 'Campagne supprimée avec succès',
      loadError: 'Échec du chargement des campagnes',
      saveError: 'Échec de la sauvegarde de la campagne',
      deleteError: 'Échec de la suppression de la campagne',
      form: {
        title: 'Titre de la Campagne',
        description: 'Description',
        company: 'Entreprise',
        startDate: 'Date de Début',
        endDate: 'Date de Fin',
        status: 'Statut'
      },
      status: {
        draft: 'Brouillon',
        active: 'Active',
        completed: 'Terminée',
        archived: 'Archivée'
      },
      errors: {
        loadFailed: 'Échec du chargement des campagnes',
        saveFailed: 'Échec de la sauvegarde de la campagne'
      }
    },
    users: {
      title: 'Gestion des Utilisateurs',
      create: 'Créer un Utilisateur',
      edit: 'Modifier l\'Utilisateur',
      viewUser: 'Voir les Détails de l\'Utilisateur',
      firstName: 'Prénom',
      lastName: 'Nom',
      email: 'Email',
      userType: 'Type d\'Utilisateur',
      company: 'Entreprise',
      teamManager: 'Responsable d\'Équipe',
      status: 'Statut',
      isActive: 'Statut Actif',
      createdAt: 'Créé le',
      emailHint: 'Cet email doit correspondre à un compte utilisateur Auth0',
      emailReadonlyHint: 'L\'email ne peut pas être modifié après la création',
      companyHint: 'Optionnel - laisser vide pour les utilisateurs système',
      teamManagerHint: 'Sélectionner un responsable d\'équipe pour cet utilisateur (uniquement pour le type utilisateur)',
      selectCompanyFirst: 'Sélectionner une Entreprise pour Voir les Utilisateurs',
      selectCompanyHint: 'Veuillez sélectionner une entreprise dans le filtre ci-dessus pour voir et gérer les utilisateurs',
      selectCompanyToCreate: 'Veuillez d\'abord sélectionner une entreprise pour créer un utilisateur',
      userTypes: {
        admin: 'Administrateur',
        team_manager: 'Responsable d\'Équipe',
        user: 'Utilisateur'
      },
      confirmDelete: 'Confirmer la Suppression de l\'Utilisateur',
      deleteWarning: 'Êtes-vous sûr de vouloir supprimer l\'utilisateur "{name}" ? Choisissez le type de suppression ci-dessous.',
      softDelete: 'Suppression Douce (Désactiver l\'utilisateur)',
      hardDelete: 'Suppression Définitive (Supprimer définitivement de la base de données)',
      createSuccess: 'Utilisateur créé avec succès',
      updateSuccess: 'Utilisateur mis à jour avec succès',
      deleteSuccess: 'Utilisateur supprimé avec succès',
      loadError: 'Échec du chargement des utilisateurs',
      saveError: 'Échec de la sauvegarde de l\'utilisateur',
      deleteError: 'Échec de la suppression de l\'utilisateur'
    }
  },

  // Common translations
  common: {
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    create: 'Créer',
    close: 'Fermer',
    actions: 'Actions',
    active: 'Actif',
    inactive: 'Inactif',
    retry: 'Réessayer',
    loading: 'Chargement...',
    noData: 'Aucune donnée disponible',
    search: 'Rechercher',
    filter: 'Filtrer',
    all: 'Tous'
  },

  // Validation translations
  validation: {
    required: 'Ce champ est obligatoire',
    email: 'Veuillez saisir une adresse email valide',
    minLength: 'Minimum {min} caractères requis',
    maxLength: 'Maximum {max} caractères autorisés',
    positiveNumber: 'Veuillez saisir un nombre positif',
    nonNegativeNumber: 'Veuillez saisir un nombre non négatif'
  },

  // Lessons
  lessons: {
    title: 'Gestion des Leçons',
    subtitle: 'Gérer les leçons et le contenu d\'apprentissage',
    createLesson: 'Créer une Leçon',
    editLesson: 'Modifier la Leçon',
    selectCampaign: 'Sélectionner une Campagne',
    selectCampaignFirst: 'Veuillez sélectionner une campagne pour gérer les leçons',
    deleteConfirm: 'Êtes-vous sûr de vouloir supprimer {name} ?',
    createSuccess: 'Leçon créée avec succès',
    updateNotImplemented: 'Fonctionnalité de mise à jour pas encore implémentée',
    deleteNotImplemented: 'Fonctionnalité de suppression pas encore implémentée',
    form: {
      title: 'Titre de la Leçon',
      description: 'Description',
      order: 'Ordre',
      maxPoints: 'Points Maximum',
      content: 'Contenu'
    },
    errors: {
      loadFailed: 'Échec du chargement des leçons',
      saveFailed: 'Échec de la sauvegarde de la leçon'
    }
  },

  // Documents
  documents: {
    title: 'Gestion des Documents',
    subtitle: 'Gérer les documents et ressources',
    createDocument: 'Créer un Document',
    editDocument: 'Modifier le Document',
    uploadDocument: 'Télécharger un Document',
    downloadDocument: 'Télécharger',
    deleteConfirm: 'Êtes-vous sûr de vouloir supprimer {name} ?',
    createSuccess: 'Document créé avec succès',
    updateNotImplemented: 'Fonctionnalité de mise à jour pas encore implémentée',
    deleteNotImplemented: 'Fonctionnalité de suppression pas encore implémentée',
    form: {
      title: 'Titre du Document',
      description: 'Description',
      fileName: 'Nom du Fichier',
      fileType: 'Type de Fichier',
      campaign: 'Campagne',
      lesson: 'Leçon'
    },
    errors: {
      loadFailed: 'Échec du chargement des documents',
      saveFailed: 'Échec de la sauvegarde du document'
    }
  },

  // Traductions Team Manager
  teamManager: {
    dashboard: {
      title: 'Tableau de Bord Responsable d\'Équipe',
      subtitle: 'Gérez vos équipes et suivez leur progression',
      totalPoints: 'Points Totaux',
      completedLessons: 'Leçons Terminées',
      selectCompany: 'Sélectionner une Entreprise',
      selectCampaign: 'Sélectionner une Campagne',
      noCompanies: 'Aucune entreprise disponible',
      noCampaigns: 'Aucune campagne disponible',
      noTeams: 'Aucune équipe à gérer',
      selectCompanyAndCampaign: 'Veuillez sélectionner une entreprise et une campagne pour voir les données d\'équipe',
      teamProgress: 'Progression de l\'Équipe',
      memberProgress: 'Progression des Membres',
      assignPoints: 'Attribuer des Points',
      viewDetails: 'Voir les Détails',
      refreshData: 'Actualiser les Données',
      loading: 'Chargement...',
      loadError: 'Échec du chargement des données',
      assignSuccess: 'Points attribués avec succès',
      assignError: 'Échec de l\'attribution des points',
      lessonNotFound: 'Leçon non trouvée'
    }
  },

  // Navigation
  navigation: {
    dashboard: 'Tableau de Bord',
    admin: 'Administration',
    companies: 'Entreprises',
    campaigns: 'Campagnes',
    users: 'Utilisateurs',
    profile: 'Profil',
    logout: 'Déconnexion',
    teamManagerDashboard: 'Tableau de Bord Responsable d\'Équipe'
  },

  // Traductions des campagnes côté joueur
  campaigns: {
    // Liste/Aperçu des Campagnes
    title: 'Mes Campagnes d\'Apprentissage',
    subtitle: 'Suivez votre progression dans toutes les campagnes assignées',
    noCampaigns: 'Aucune campagne disponible',
    noCampaignsDesc: 'Vous n\'êtes actuellement inscrit à aucune campagne. Contactez votre administrateur pour commencer.',
    loading: 'Chargement de vos campagnes...',
    loadError: 'Échec du chargement des campagnes',
    retry: 'Réessayer',
    
    // Carte/Élément de Campagne
    card: {
      title: 'Campagne',
      company: 'Entreprise',
      progress: 'Progression',
      status: 'Statut',
      lessons: 'Leçons',
      points: 'Points',
      startDate: 'Date de Début',
      endDate: 'Date de Fin',
      duration: 'Durée',
      difficulty: 'Difficulté',
      category: 'Catégorie',
      description: 'Description',
      
      // États de Progression
      notStarted: 'Non Commencé',
      inProgress: 'En Cours',
      completed: 'Terminé',
      paused: 'En Pause',
      expired: 'Expiré',
      
      // Détails de Progression
      completedLessons: '{completed} sur {total} leçons',
      earnedPoints: '{earned} sur {total} points',
      completionRate: '{percentage}% terminé',
      timeRemaining: '{days} jours restants',
      timeElapsed: '{days} jours depuis le début',
      
      // Actions
      startCampaign: 'Commencer la Campagne',
      continueCampaign: 'Continuer l\'Apprentissage',
      resumeCampaign: 'Reprendre',
      reviewCampaign: 'Réviser',
      viewDetails: 'Voir les Détails',
      viewCertificate: 'Voir le Certificat',
      retakeCampaign: 'Reprendre la Campagne'
    },
    
    // Vue Détaillée de la Campagne
    details: {
      title: 'Détails de la Campagne',
      overview: 'Aperçu',
      progress: 'Ma Progression',
      lessons: 'Leçons',
      documents: 'Ressources',
      achievements: 'Réussites',
      leaderboard: 'Classement',
      
      // Informations sur la Campagne
      campaignInfo: 'Informations de la Campagne',
      learningObjectives: 'Objectifs d\'Apprentissage',
      prerequisites: 'Prérequis',
      estimatedTime: 'Temps Estimé',
      completionCriteria: 'Critères de Réussite',
      
      // Section Progression
      overallProgress: 'Progression Globale',
      lessonsProgress: 'Progression des Leçons',
      pointsProgress: 'Progression des Points',
      timeSpent: 'Temps Passé',
      lastActivity: 'Dernière Activité',
      startedOn: 'Commencé le',
      expectedCompletion: 'Fin Prévue',
      
      // Statistiques
      averageScore: 'Score Moyen',
      bestScore: 'Meilleur Score',
      totalAttempts: 'Total des Tentatives',
      streak: 'Série d\'Apprentissage',
      rank: 'Mon Rang',
      
      // Messages
      notStartedMessage: 'Vous n\'avez pas encore commencé cette campagne.',
      completedMessage: 'Félicitations ! Vous avez terminé cette campagne.',
      inProgressMessage: 'Continuez comme ça ! Vous faites d\'excellents progrès.',
      pausedMessage: 'Cette campagne est actuellement en pause. Contactez votre administrateur.',
      expiredMessage: 'Cette campagne a expiré. Certaines fonctionnalités peuvent être limitées.'
    },
    
    // Actions de Campagne
    actions: {
      start: 'Commencer la Campagne',
      continue: 'Continuer',
      pause: 'Mettre en Pause',
      resume: 'Reprendre',
      restart: 'Recommencer',
      complete: 'Marquer comme Terminé',
      review: 'Réviser',
      bookmark: 'Mettre en Favoris',
      share: 'Partager la Progression',
      exportProgress: 'Exporter la Progression',
      downloadCertificate: 'Télécharger le Certificat',
      
      // Confirmations
      confirmStart: 'Êtes-vous prêt à commencer cette campagne ?',
      confirmPause: 'Êtes-vous sûr de vouloir mettre en pause cette campagne ?',
      confirmRestart: 'Êtes-vous sûr de vouloir recommencer cette campagne ? Votre progression actuelle sera perdue.',
      confirmComplete: 'Marquer cette campagne comme terminée ?',
      
      // Résultats
      startSuccess: 'Campagne commencée avec succès !',
      pauseSuccess: 'Campagne mise en pause.',
      resumeSuccess: 'Campagne reprise.',
      restartSuccess: 'Campagne recommencée.',
      completeSuccess: 'Campagne marquée comme terminée !',
      
      // Erreurs
      startError: 'Échec du démarrage de la campagne',
      pauseError: 'Échec de la mise en pause de la campagne',
      resumeError: 'Échec de la reprise de la campagne',
      restartError: 'Échec du redémarrage de la campagne',
      completeError: 'Échec de la finalisation de la campagne'
    },
    
    // Filtrage et Tri
    filters: {
      title: 'Filtrer les Campagnes',
      all: 'Toutes les Campagnes',
      active: 'Actives',
      completed: 'Terminées',
      notStarted: 'Non Commencées',
      inProgress: 'En Cours',
      paused: 'En Pause',
      expired: 'Expirées',
      
      // Options de Tri
      sortBy: 'Trier par',
      sortByDate: 'Date',
      sortByProgress: 'Progression',
      sortByName: 'Nom',
      sortByCompany: 'Entreprise',
      sortByPriority: 'Priorité',
      
      // Direction du Tri
      ascending: 'Croissant',
      descending: 'Décroissant',
      
      // Recherche
      searchPlaceholder: 'Rechercher des campagnes...',
      noResults: 'Aucune campagne ne correspond à vos filtres',
      clearFilters: 'Effacer les Filtres'
    },
    
    // Messages de Statut de Campagne
    status: {
      upcoming: 'À Venir',
      active: 'Active',
      completed: 'Terminée',
      expired: 'Expirée',
      paused: 'En Pause',
      cancelled: 'Annulée',
      draft: 'Brouillon'
    },
    
    // Notifications
    notifications: {
      newCampaign: 'Nouvelle campagne assignée : {campaignName}',
      campaignStarted: 'Campagne commencée : {campaignName}',
      campaignCompleted: 'Campagne terminée : {campaignName}',
      deadlineApproaching: 'Date limite approchant : {campaignName}',
      campaignExpired: 'Campagne expirée : {campaignName}',
      progressUpdate: 'Progression mise à jour pour : {campaignName}',
      certificateAvailable: 'Certificat disponible pour : {campaignName}'
    }
  }
} 