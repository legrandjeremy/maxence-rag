import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { teamService, userService, createResponse } from '../../lib/common';
import { TeamMemberAddRequest, TeamMemberCreateRequest } from '../../models/Team';
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

    // Get teamId from path parameters
    const teamId = event.pathParameters?.teamId;
    if (!teamId?.trim()) {
      return createResponse(400, { error: 'Team ID is required' });
    }

    // Parse request body
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const request: TeamMemberAddRequest = JSON.parse(event.body);

    // Validate required fields
    if (!request.userId?.trim()) {
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

    // Check if user exists
    const user = await userService.getUserById(request.userId);
    if (!user) {
      return createResponse(404, { error: 'User not found' });
    }

    // Check if user is already in a team
    const existingTeamMembership = await teamService.getUserTeam(request.userId);
    if (existingTeamMembership) {
      return createResponse(409, { error: 'User is already a member of another team' });
    }

    // Add team member
    const teamMemberRequest: TeamMemberCreateRequest = {
      teamId,
      userId: request.userId
    };
    const teamMember = await teamService.addTeamMember(teamMemberRequest, authResult.user.sub);

    // Update user's teamId
    await userService.updateUser(request.userId, { teamId });

    return createResponse(201, teamMember);

  } catch (error) {
    console.error('Error adding team member:', error);
    
    if (error instanceof SyntaxError) {
      return createResponse(400, { error: 'Invalid JSON in request body' });
    }

    return createResponse(500, { error: 'Internal server error' });
  }
}; 