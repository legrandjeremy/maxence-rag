import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { teamService, userService, createResponse } from '../../lib/common';
import { extractAuth0User, checkAdminPermission, checkTeamManagerPermission } from '../../lib/auth';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Verify authorization
    const authResult = extractAuth0User(event);
    if (!authResult.success || !authResult.user) {
      return createResponse(401, { error: 'Unauthorized' });
    }

    // Check permissions - admin or team manager
    const isAdmin = checkAdminPermission(authResult.user);
    const isTeamManager = checkTeamManagerPermission(authResult.user);

    if (!isAdmin && !isTeamManager) {
      return createResponse(403, { error: 'Insufficient permissions' });
    }

    // Get parameters
    const teamId = event.pathParameters?.teamId;
    const userId = event.pathParameters?.userId;

    if (!teamId) {
      return createResponse(400, { error: 'Team ID is required' });
    }

    if (!userId) {
      return createResponse(400, { error: 'User ID is required' });
    }

    // Check if team exists
    const team = await teamService.getTeamById(teamId);
    if (!team) {
      return createResponse(404, { error: 'Team not found' });
    }

    // Check authorization for team management
    if (!isAdmin && team.managerId !== authResult.user.sub) {
      return createResponse(403, { error: 'You can only manage your own teams' });
    }

    // Check if user is actually a member of this team
    const teamMembers = await teamService.getTeamMembers(teamId);
    const isMember = teamMembers.some(member => member.userId === userId);
    
    if (!isMember) {
      return createResponse(404, { error: 'User is not a member of this team' });
    }

    // Remove team member
    await teamService.removeTeamMember(teamId, userId);

    // Update user's teamId to null
    await userService.updateUser(userId, { teamId: undefined });

    return createResponse(200, { message: 'Team member removed successfully' });

  } catch (error) {
    console.error('Error removing team member:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}; 