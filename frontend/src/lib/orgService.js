import { auth } from './firebase';

const API_BASE = "http://localhost:5001/api";

/**
 * Helper: request
 * Makes an HTTP fetch call to the backend with appropriate JSON and Authorization headers.
 */
async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // For Hackathon/Local testing: If we have a localRole set, we prefer sending the mock token 
  // so the mock backend knows our exact role, bypassing real Firebase tokens.
  const localRole = localStorage.getItem('lastSelectedRole') || 'Employee';
  const mockToken = localRole === 'Admin' ? 'mock-admin' : 'mock-employee';
  
  if (mockToken) {
    headers['Authorization'] = `Bearer ${mockToken}`;
  } else if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    } catch (e) {
      console.warn("Failed to get Firebase Auth ID token:", e);
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Request failed');
  }

  return data;
}

export const orgService = {
  /**
   * List all departments
   */
  async listDepartments() {
    return request('/admin/departments');
  },

  /**
   * List all employees
   */
  async listEmployees() {
    return request('/admin/employees');
  },

  /**
   * Modify employee role
   */
  async promoteUser(employeeId, newRole) {
    return request(`/admin/employees/${employeeId}/department`, {
      method: 'PATCH',
      body: JSON.stringify({ role: newRole })
    });
  },

  /**
   * Create a new department
   */
  async createDepartment(deptData) {
    return request('/admin/departments', {
      method: 'POST',
      body: JSON.stringify({
        name: deptData.name,
        description: deptData.head ? `Head: ${deptData.head}` : 'Department description'
      })
    });
  },

  /**
   * Update an existing department
   */
  async updateDepartment(deptId, deptData) {
    return request(`/admin/departments/${deptId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: deptData.name,
        description: deptData.head ? `Head: ${deptData.head}` : 'Department description'
      })
    });
  },

  /**
   * Create (invite) a new employee record
   */
  async createEmployee(empData) {
    return request('/admin/employees', {
      method: 'POST',
      body: JSON.stringify({
        name: empData.name,
        email: empData.email,
        departmentId: empData.departmentId,
        role: empData.role
      })
    });
  },

  /**
   * Remove/delete an employee record
   */
  async deleteEmployee(employeeId) {
    return request(`/admin/employees/${employeeId}`, {
      method: 'DELETE'
    });
  },

  /**
   * Get recent activity logs for dashboard
   */
  async getRecentActivity(limitCount = 3) {
    try {
      const response = await fetch(`${API_BASE}/dashboard/activities?limit=${limitCount}`);
      if (!response.ok) throw new Error("Failed to fetch activities");
      const data = await response.json();
      
      return data.map(log => {
        const assetName = log.entityType === 'assets' ? `Asset ${log.entityId}` : 'System';
        let displayAction = log.actionType;
        if (log.actionType === 'ASSET_ALLOCATION') displayAction = 'Allocated';
        else if (log.actionType === 'TRANSFER_APPROVED') displayAction = 'Transferred';
        else if (log.actionType === 'ASSET_RETURNED') displayAction = 'Returned';
        else if (log.actionType === 'MAINTENANCE_APPROVED') displayAction = 'Approved Maintenance';
        else if (log.actionType === 'MAINTENANCE_RESOLVED') displayAction = 'Resolved Maintenance';

        return {
          id: log.id,
          assetName: assetName,
          action: displayAction.toLowerCase(),
          personName: log.actorUserId === 'SYSTEM' ? 'System' : `User (${log.actorUserId.substring(0, 5)})`,
          deptName: log.message || "Activity logged"
        };
      });
    } catch (error) {
      console.error("getRecentActivity failed:", error);
      return [];
    }
  },

  /**
   * Get logged-in user's tasks/deadlines
   */
  async getMyDeadlines() {
    try {
      return request('/employee/deadlines');
    } catch (error) {
      console.error("getMyDeadlines failed:", error);
      return [];
    }
  }
};
