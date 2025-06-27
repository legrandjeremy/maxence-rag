import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { userProgressService, teamService, lessonService, createResponse } from '../../lib/common';
import { UserProgressCreateRequest, UserProgressUpdateRequest } from '../../models/UserProgress';
import { extractAuth0User, checkAdminPermission, checkTeamManagerPermission } from '../../lib/auth';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Verify authorization
    const authResult = extractAuth0User(event);
    if (!authResult.success || !authResult.user) {
      return createResponse(401, { error: 'Unauthorized' });
    }

    // Check team manager permissions
    const isAdmin = checkAdminPermission(authResult.user);
    const isTeamManager = checkTeamManagerPermission(authResult.user);

    if (!isAdmin && !isTeamManager) {
      return createResponse(403, { error: 'Insufficient permissions' });
    }

    // Parse request body
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const request = JSON.parse(event.body);

    // Validate required fields
    if (!request.userId?.trim()) {
      return createResponse(400, { error: 'User ID is required' });
    }

    if (!request.lessonId?.trim()) {
      return createResponse(400, { error: 'Lesson ID is required' });
    }

    if (!request.campaignId?.trim()) {
      return createResponse(400, { error: 'Campaign ID is required' });
    }

    if (typeof request.pointsEarned !== 'number' || request.pointsEarned < 0) {
      return createResponse(400, { error: 'Valid points earned is required' });
    }

    if (typeof request.maxPoints !== 'number' || request.maxPoints <= 0) {
      return createResponse(400, { error: 'Valid max points is required' });
    }

    if (request.pointsEarned > request.maxPoints) {
      return createResponse(400, { error: 'Points earned cannot exceed max points' });
    }

    // Get user's team membership
    const userTeamMembership = await teamService.getUserTeam(request.userId);
    if (!userTeamMembership) {
      return createResponse(404, { error: 'User is not a member of any team' });
    }

    // Get team details
    const team = await teamService.getTeamById(userTeamMembership.teamId);
    if (!team) {
      return createResponse(404, { error: 'Team not found' });
    }

    // Check if the current user is the team manager (or admin)
    if (!isAdmin && team.managerId !== authResult.user.sub) {
      return createResponse(403, { error: 'You can only assign points to members of your own team' });
    }

    // Verify lesson exists
    const lesson = await lessonService.getLessonById(request.lessonId);
    if (!lesson) {
      return createResponse(404, { error: 'Lesson not found' });
    }

    // Check if progress already exists for this user/lesson/campaign
    const existingProgress = await userProgressService.getUserProgress(
      request.userId,
      request.lessonId,
      request.campaignId
    );

    let progress;

    if (existingProgress) {
      // Update existing progress
      const updateRequest: UserProgressUpdateRequest = {
        pointsEarned: request.pointsEarned,
        notes: request.notes,
        assignedBy: authResult.user.sub
      };

      progress = await userProgressService.updateUserProgress(
        existingProgress.id,
        updateRequest
      );
    } else {
      // Create new progress record
      const createRequest: UserProgressCreateRequest = {
        userId: request.userId,
        lessonId: request.lessonId,
        campaignId: request.campaignId,
        pointsEarned: request.pointsEarned,
        maxPoints: request.maxPoints,
        assignedBy: authResult.user.sub,
        teamId: userTeamMembership.teamId,
        notes: request.notes
      };

      progress = await userProgressService.createUserProgress(createRequest);
    }

    return createResponse(200, progress);

  } catch (error) {
    console.error('Error assigning lesson points:', error);
    
    if (error instanceof SyntaxError) {
      return createResponse(400, { error: 'Invalid JSON in request body' });
    }

    return createResponse(500, { error: 'Internal server error' });
  }
}; 