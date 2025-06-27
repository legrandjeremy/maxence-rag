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

    // Get team ID from path parameters
    const teamId = event.pathParameters?.id;
    if (!teamId) {
      return createResponse(400, { error: 'Team ID is required' });
    }

    // Check if team exists
    const team = await teamService.getTeamById(teamId);
    if (!team) {
      return createResponse(404, { error: 'Team not found' });
    }

    // Check authorization for team access
    if (!isAdmin && team.managerId !== authResult.user.sub) {
      return createResponse(403, { error: 'You can only view your own team members' });
    }

    // Get team members
    const teamMembers = await teamService.getTeamMembers(teamId);

    // Get user details for each team member
    const membersWithUserInfo = await Promise.all(
      teamMembers.map(async (member) => {
        const user = await userService.getUserById(member.userId);
        return {
          ...member,
          user: user ? {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            userType: user.userType,
            isActive: user.isActive
          } : null
        };
      })
    );

    return createResponse(200, {
      teamId: team.id,
      teamName: team.name,
      members: membersWithUserInfo
    });

  } catch (error) {
    console.error('Error getting team members:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}; 