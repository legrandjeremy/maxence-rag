import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { teamService, userService, userProgressService, lessonService, createResponse } from '../../lib/common';
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

    // Get parameters
    const teamId = event.pathParameters?.teamId;
    const lessonId = event.pathParameters?.lessonId;
    const campaignId = event.queryStringParameters?.campaignId;

    if (!teamId) {
      return createResponse(400, { error: 'Team ID is required' });
    }

    if (!lessonId) {
      return createResponse(400, { error: 'Lesson ID is required' });
    }

    if (!campaignId) {
      return createResponse(400, { error: 'Campaign ID is required' });
    }

    // Get team details
    const team = await teamService.getTeamById(teamId);
    if (!team) {
      return createResponse(404, { error: 'Team not found' });
    }

    // Check if the current user is the team manager (or admin)
    if (!isAdmin && team.managerId !== authResult.user.sub) {
      return createResponse(403, { error: 'You can only view progress for your own team' });
    }

    // Get lesson details
    const lesson = await lessonService.getLessonById(lessonId);
    if (!lesson) {
      return createResponse(404, { error: 'Lesson not found' });
    }

    // Get team members
    const teamMembers = await teamService.getTeamMembers(teamId);

    // Get progress for each team member
    const userProgresses = await Promise.all(
      teamMembers.map(async (member) => {
        const user = await userService.getUserById(member.userId);
        const progress = await userProgressService.getUserProgress(
          member.userId,
          lessonId,
          campaignId
        );

        return {
          userId: member.userId,
          userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
          pointsEarned: progress?.pointsEarned || 0,
          maxPoints: progress?.maxPoints || lesson.points || 0,
          completedAt: progress?.completedAt,
          assignedBy: progress?.assignedBy,
          notes: progress?.notes
        };
      })
    );

    // Calculate team statistics
    const totalUsers = userProgresses.length;
    const completedUsers = userProgresses.filter(p => p.completedAt).length;
    const totalPointsEarned = userProgresses.reduce((sum, p) => sum + p.pointsEarned, 0);
    const totalMaxPoints = userProgresses.reduce((sum, p) => sum + p.maxPoints, 0);
    
    const averageScore = totalMaxPoints > 0 ? (totalPointsEarned / totalMaxPoints) * 100 : 0;
    const completionRate = totalUsers > 0 ? (completedUsers / totalUsers) * 100 : 0;

    const response = {
      lessonId: lesson.id,
      lessonName: lesson.name,
      campaignId,
      campaignName: '', // Would need to fetch campaign details
      teamId: team.id,
      teamName: team.name,
      userProgresses,
      averageScore: Math.round(averageScore * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100
    };

    return createResponse(200, response);

  } catch (error) {
    console.error('Error getting team lesson progress:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}; 