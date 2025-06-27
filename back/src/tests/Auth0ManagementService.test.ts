import { Auth0ManagementService } from '../lib/Auth0ManagementService';

// Mock the auth0 package
jest.mock('auth0', () => ({
  ManagementClient: jest.fn().mockImplementation(() => ({
    users: {
      getByEmail: jest.fn(),
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      assignRoles: jest.fn(),
      removeRoles: jest.fn(),
      getRoles: jest.fn()
    },
    roles: {
      getAll: jest.fn(),
      getPermissions: jest.fn()
    }
  }))
}));

describe('Auth0ManagementService', () => {
  let service: Auth0ManagementService;
  let mockClient: any;

  beforeEach(() => {
    // Set up environment variables
    process.env.AUTH0_DOMAIN = 'test.auth0.com';
    process.env.AUTH0_MANAGEMENT_CLIENT_ID = 'test-client-id';
    process.env.AUTH0_MANAGEMENT_CLIENT_SECRET = 'test-client-secret';
    process.env.AUTH0_AUDIENCE = 'https://defi.maijin';
    process.env.AUTH0_ADMIN_ROLE_ID = 'rol_admin123';
    process.env.AUTH0_TEAM_MANAGER_ROLE_ID = 'rol_manager123';
    process.env.AUTH0_USER_ROLE_ID = 'rol_user123';

    service = new Auth0ManagementService();
    mockClient = (service as any).client;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserByEmail', () => {
    it('should return user when found', async () => {
      const mockUser = {
        user_id: 'auth0|123',
        email: 'test@example.com',
        name: 'Test User'
      };

      mockClient.users.getByEmail.mockResolvedValue([mockUser]);

      const result = await service.getUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockClient.users.getByEmail).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should return null when user not found', async () => {
      mockClient.users.getByEmail.mockResolvedValue([]);

      const result = await service.getUserByEmail('notfound@example.com');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockClient.users.getByEmail.mockRejectedValue(new Error('API Error'));

      const result = await service.getUserByEmail('error@example.com');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const mockCreatedUser = {
        user_id: 'auth0|123',
        email: 'new@example.com',
        given_name: 'John',
        family_name: 'Doe',
        name: 'John Doe'
      };

      mockClient.users.create.mockResolvedValue(mockCreatedUser);

      const result = await service.createUser('new@example.com', 'John', 'Doe');

      expect(result).toEqual(mockCreatedUser);
      expect(mockClient.users.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        given_name: 'John',
        family_name: 'Doe',
        name: 'John Doe',
        connection: 'Username-Password-Authentication',
        email_verified: false,
        verify_email: true
      });
    });

    it('should handle creation errors', async () => {
      mockClient.users.create.mockRejectedValue(new Error('Creation failed'));

      const result = await service.createUser('error@example.com', 'John', 'Doe');

      expect(result).toBeNull();
    });
  });

  describe('syncUserPermissions', () => {
    it('should sync admin permissions successfully', async () => {
      const userId = 'auth0|123';
      const mockCurrentRoles = [{ id: 'rol_old123', name: 'Old Role' }];

      mockClient.users.getRoles.mockResolvedValue(mockCurrentRoles);
      mockClient.users.removeRoles.mockResolvedValue({});
      mockClient.users.assignRoles.mockResolvedValue({});
      mockClient.users.update.mockResolvedValue({});

      const result = await service.syncUserPermissions(userId, 'admin');

      expect(result).toBe(true);
      expect(mockClient.users.getRoles).toHaveBeenCalledWith({ id: userId });
      expect(mockClient.users.removeRoles).toHaveBeenCalledWith(
        { id: userId },
        { roles: ['rol_old123'] }
      );
      expect(mockClient.users.assignRoles).toHaveBeenCalledWith(
        { id: userId },
        { roles: ['rol_admin123'] }
      );
      expect(mockClient.users.update).toHaveBeenCalledWith(
        { id: userId },
        {
          app_metadata: {
            user_type: 'admin',
            permissions: [
              'maijin-defi-challenge:admin',
              'maijin-defi-challenge:team-manager',
              'maijin-defi-challenge:user',
              'maijin-defi-challenge:read',
              'maijin-defi-challenge:write'
            ],
            last_updated: expect.any(String)
          }
        }
      );
    });

    it('should sync team_manager permissions successfully', async () => {
      const userId = 'auth0|456';
      mockClient.users.getRoles.mockResolvedValue([]);
      mockClient.users.assignRoles.mockResolvedValue({});
      mockClient.users.update.mockResolvedValue({});

      const result = await service.syncUserPermissions(userId, 'team_manager');

      expect(result).toBe(true);
      expect(mockClient.users.assignRoles).toHaveBeenCalledWith(
        { id: userId },
        { roles: ['rol_manager123'] }
      );
    });

    it('should sync user permissions successfully', async () => {
      const userId = 'auth0|789';
      mockClient.users.getRoles.mockResolvedValue([]);
      mockClient.users.assignRoles.mockResolvedValue({});
      mockClient.users.update.mockResolvedValue({});

      const result = await service.syncUserPermissions(userId, 'user');

      expect(result).toBe(true);
      expect(mockClient.users.assignRoles).toHaveBeenCalledWith(
        { id: userId },
        { roles: ['rol_user123'] }
      );
    });

    it('should handle missing role ID configuration', async () => {
      delete process.env.AUTH0_ADMIN_ROLE_ID;
      service = new Auth0ManagementService();

      const result = await service.syncUserPermissions('auth0|123', 'admin');

      expect(result).toBe(false);
    });

    it('should handle sync errors', async () => {
      mockClient.users.getRoles.mockRejectedValue(new Error('Sync failed'));

      const result = await service.syncUserPermissions('auth0|123', 'admin');

      expect(result).toBe(false);
    });
  });

  describe('createOrUpdateUserWithPermissions', () => {
    it('should create new user and sync permissions', async () => {
      const mockUser = {
        user_id: 'auth0|123',
        email: 'new@example.com'
      };

      mockClient.users.getByEmail.mockResolvedValue([]); // User doesn't exist
      mockClient.users.create.mockResolvedValue(mockUser);
      mockClient.users.getRoles.mockResolvedValue([]);
      mockClient.users.assignRoles.mockResolvedValue({});
      mockClient.users.update.mockResolvedValue({});
      mockClient.users.get.mockResolvedValue(mockUser);

      const result = await service.createOrUpdateUserWithPermissions(
        'new@example.com',
        'John',
        'Doe',
        'admin'
      );

      expect(result).toEqual(mockUser);
      expect(mockClient.users.create).toHaveBeenCalled();
      expect(mockClient.users.assignRoles).toHaveBeenCalled();
    });

    it('should update existing user and sync permissions', async () => {
      const mockUser = {
        user_id: 'auth0|123',
        email: 'existing@example.com'
      };

      mockClient.users.getByEmail.mockResolvedValue([mockUser]); // User exists
      mockClient.users.getRoles.mockResolvedValue([]);
      mockClient.users.assignRoles.mockResolvedValue({});
      mockClient.users.update.mockResolvedValue({});
      mockClient.users.get.mockResolvedValue(mockUser);

      const result = await service.createOrUpdateUserWithPermissions(
        'existing@example.com',
        'John',
        'Doe',
        'team_manager'
      );

      expect(result).toEqual(mockUser);
      expect(mockClient.users.create).not.toHaveBeenCalled();
      expect(mockClient.users.assignRoles).toHaveBeenCalled();
    });

    it('should handle errors during creation', async () => {
      mockClient.users.getByEmail.mockResolvedValue([]);
      mockClient.users.create.mockRejectedValue(new Error('Creation failed'));

      const result = await service.createOrUpdateUserWithPermissions(
        'error@example.com',
        'John',
        'Doe',
        'user'
      );

      expect(result).toBeNull();
    });
  });

  describe('userExists', () => {
    it('should return true when user exists', async () => {
      mockClient.users.getByEmail.mockResolvedValue([{ user_id: 'auth0|123' }]);

      const result = await service.userExists('exists@example.com');

      expect(result).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      mockClient.users.getByEmail.mockResolvedValue([]);

      const result = await service.userExists('notexists@example.com');

      expect(result).toBe(false);
    });
  });
}); 