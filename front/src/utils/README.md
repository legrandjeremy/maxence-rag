# Utility Functions

## Error Handlers

### `errorHandlers.ts`

This utility provides standardized error handling for the application, particularly focused on Auth0 authentication errors.

#### Key Features:

- **Consent Required Error Handling**: Automatically logs out users when a "Consent required" error is detected. This typically happens when:
  - The OAuth scopes required by the application have changed
  - The user hasn't consented to the new scopes
  - The application attempts to get an access token silently

#### Usage Example:

```typescript
import { handleApiError } from 'src/utils/errorHandlers'

async function callApi() {
  try {
    // API call logic
    const response = await fetch('...')
    return await response.json()
  } catch (error) {
    return handleApiError(error)
  }
}
```

### Implementation Details

When a "Consent required" error is detected:
1. A notification is shown to the user
2. The user is logged out and redirected to the homepage
3. Upon next login, Auth0 will prompt the user to accept the new permissions

This prevents a blank page/blocked state when scope changes require consent. 