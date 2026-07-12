// Seed data script for prototyping.
// This is the only place static arrays are allowed, simulating writing initial data into the database.
// This file is never imported by component code.

const defaultEmployees = [
  { id: 'emp-1', name: 'Priya Shah', email: 'priya@assetflow.com', role: 'Employee', department: 'IT' },
  { id: 'emp-2', name: 'John Doe', email: 'john@assetflow.com', role: 'Employee', department: 'Engineering' },
  { id: 'emp-3', name: 'Jane Admin', email: 'admin@assetflow.com', role: 'Admin', department: 'Operations' },
  { id: 'emp-4', name: 'David Lee', email: 'david@assetflow.com', role: 'Employee', department: 'Facilities' },
];

const defaultDepartments = [
  { id: 'dept-1', name: 'Engineering', head: 'John Doe', parentDept: 'Operations', status: 'Active' },
  { id: 'dept-2', name: 'IT', head: 'Priya Shah', parentDept: 'Operations', status: 'Active' },
  { id: 'dept-3', name: 'Operations', head: 'Jane Admin', parentDept: '', status: 'Active' },
  { id: 'dept-4', name: 'Facilities', head: 'David Lee', parentDept: 'Operations', status: 'Inactive' },
];

const defaultCategories = [
  { id: 'cat-1', name: 'Laptops', extraFields: [{ key: 'RAM', value: '16GB' }, { key: 'Storage', value: '512GB SSD' }] },
  { id: 'cat-2', name: 'Monitors', extraFields: [{ key: 'Resolution', value: '4K' }, { key: 'Size', value: '27-inch' }] },
  { id: 'cat-3', name: 'Office Chairs', extraFields: [{ key: 'Ergonomic', value: 'Yes' }] },
];

export function seedLocalStorage() {
  if (!localStorage.getItem('assetflow_seeded')) {
    localStorage.setItem('employees', JSON.stringify(defaultEmployees));
    localStorage.setItem('departments', JSON.stringify(defaultDepartments));
    localStorage.setItem('categories', JSON.stringify(defaultCategories));
    localStorage.setItem('assetflow_seeded', 'true');
    console.log('Mock database seeded successfully.');
  }
}
