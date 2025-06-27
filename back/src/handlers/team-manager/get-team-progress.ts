import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { teamService, userService, userProgressService, createResponse } from '../../lib/common';
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
    const userId = event.queryStringParameters?.userId;
    const campaignId = event.queryStringParameters?.campaignId;

    if (!teamId) {
      return createResponse(400, { error: 'Team ID is required' });
    }

    if (!campaignId) {
      return createResponse(400, { error: 'Campaign ID is required' });
    }

    // Get team details
    const team = await teamService.getTeamById(teamId);
    if (!team) {
      return createResponse(404, { error: 'Team not found' });
    }

    // Get the current user's internal ID to check team management
    let currentUser = null;
    
    // Try to find user by Auth0 ID first
    currentUser = await userService.getUserByEmail(authResult.user['https//defi.maijin/email']);

    if (!currentUser) {
      return createResponse(404, { error: 'User not found in system' });
    }

    // Check if the current user is the team manager (or admin)
    if (!isAdmin && team.managerId !== currentUser.id) {
      return createResponse(403, { error: 'You can only view progress for your own team' });
    }

    // Get team members
    const teamMembers = await teamService.getTeamMembers(teamId);
    
    // Filter by specific user if userId is provided
    const targetMembers = userId 
      ? teamMembers.filter(member => member.userId === userId)
      : teamMembers;

    if (userId && targetMembers.length === 0) {
      return createResponse(404, { error: 'User not found in team' });
    }

    // Get progress for target members
    const memberProgresses = await Promise.all(
      targetMembers.map(async (member) => {
        const user = await userService.getUserById(member.userId);
        
        // Get user's campaign progress
        const userCampaignStats = await userProgressService.getUserCampaignStats(member.userId, campaignId);
        
        return {
          userId: member.userId,
          user: user ? {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            userType: user.userType,
            isActive: user.isActive
          } : null,
          joinedAt: member.joinedAt,
          totalPoints: userCampaignStats.totalPoints,
          completedLessons: userCampaignStats.completedLessons,
          lastActivity: userCampaignStats.lastActivity || member.joinedAt
        };
      })
    );

    const response = {
      teamId: team.id,
      teamName: team.name,
      members: memberProgresses
    };

    return createResponse(200, response);

  } catch (error) {
    console.error('Error getting team progress:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}; 