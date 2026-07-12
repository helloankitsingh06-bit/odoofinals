// TODO: Replace with real Backend A/B exports

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory data store for prototyping (resets on page reload)
let departments = [];
let employees = [];

export const orgService = {
  async listDepartments() {
    // TODO: replace with real Firestore query (e.g. getDocs(collection(db, 'departments')))
    await delay(300);
    return [...departments];
  },

  async listEmployees() {
    // TODO: replace with real Firestore query (e.g. getDocs(collection(db, 'employees')))
    await delay(300);
    return [...employees];
  },

  async promoteUser(employeeId, newRole) {
    // TODO: replace with real Firestore update (e.g. updateDoc(doc(db, 'employees', employeeId), { role: newRole }))
    await delay(500);
    if (!newRole) throw new Error('New role is required');
    
    const index = employees.findIndex(emp => emp.id === employeeId);
    if (index === -1) throw new Error('Employee not found');
    
    employees[index] = { ...employees[index], role: newRole };
    return employees[index];
  },

  async createDepartment(deptData) {
    // TODO: replace with real Firestore add (e.g. addDoc(collection(db, 'departments'), deptData))
    await delay(400);
    if (!deptData.name) throw new Error('Department name is required');
    
    const newDept = {
      id: `dept-${Date.now()}`,
      name: deptData.name,
      head: deptData.head || '',
      parentDept: deptData.parentDept || '',
      status: deptData.status || 'Active'
    };
    
    departments.push(newDept);
    return newDept;
  },

  async updateDepartment(deptId, deptData) {
    // TODO: replace with real Firestore update (e.g. updateDoc(doc(db, 'departments', deptId), deptData))
    await delay(400);
    const index = departments.findIndex(d => d.id === deptId);
    if (index === -1) throw new Error('Department not found');
    
    departments[index] = {
      ...departments[index],
      ...deptData
    };
    return departments[index];
  }
};
