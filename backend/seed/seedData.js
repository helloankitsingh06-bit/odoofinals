// seedData.js
const { db } = require('./firebase');

async function seed() {
  console.log('🔥 Starting seed...');

  // ---- 1. DEPARTMENTS (2) ----
  const deptRef1 = await db.collection('departments').add({
    name: 'Engineering',
    parentDepartment: null,
    status: 'Active',
    headId: null, // we'll update after employees are created
  });
  const deptRef2 = await db.collection('departments').add({
    name: 'Human Resources',
    parentDepartment: null,
    status: 'Active',
    headId: null,
  });
  console.log(`✅ Departments created: Engineering, Human Resources`);

  // ---- 2. ASSET CATEGORIES (3) ----
  const catRef1 = await db.collection('assetCategories').add({
    name: 'Electronics',
    customFields: { warrantyPeriod: '12 months' },
  });
  const catRef2 = await db.collection('assetCategories').add({
    name: 'Furniture',
    customFields: { material: 'Wood' },
  });
  const catRef3 = await db.collection('assetCategories').add({
    name: 'Vehicles',
    customFields: { fuelType: 'Petrol' },
  });
  console.log(`✅ Categories created: Electronics, Furniture, Vehicles`);

  // ---- 3. EMPLOYEES (5) ----
  // We create them with dummy UIDs. In real auth, UIDs come from Firebase Auth.
  // For seed, we just make up unique IDs.
  const employees = [
    { name: 'Alice Admin', email: 'alice@company.com', role: 'Admin', status: 'Active', departmentId: null },
    { name: 'Bob Manager', email: 'bob@company.com', role: 'Asset Manager', status: 'Active', departmentId: null },
    { name: 'Charlie Head', email: 'charlie@company.com', role: 'Department Head', status: 'Active', departmentId: null },
    { name: 'Diana Employee', email: 'diana@company.com', role: 'Employee', status: 'Active', departmentId: null },
    { name: 'Eve Employee', email: 'eve@company.com', role: 'Employee', status: 'Active', departmentId: null },
  ];

  // Store employee doc refs so we can assign department heads later
  const employeeRefs = [];

  for (const emp of employees) {
    // Assign department: first 2 to Engineering, next 2 to HR, last one to Engineering
    let deptId;
    if (emp.name === 'Alice Admin' || emp.name === 'Bob Manager' || emp.name === 'Charlie Head' || emp.name === 'Eve Employee') {
      deptId = deptRef1.id; // Engineering
    } else {
      deptId = deptRef2.id; // HR (only Diana)
    }
    emp.departmentId = deptId;

    const docRef = await db.collection('employees').add(emp);
    employeeRefs.push({ ref: docRef, name: emp.name, role: emp.role });
    console.log(`✅ Employee created: ${emp.name} (${emp.role})`);
  }

  // ---- Update department heads ----
  // Set Engineering head = Charlie Head, HR head = Diana (just for demo)
  const charlieRef = employeeRefs.find(e => e.name === 'Charlie Head').ref;
  const dianaRef = employeeRefs.find(e => e.name === 'Diana Employee').ref;
  await db.collection('departments').doc(deptRef1.id).update({ headId: charlieRef.id });
  await db.collection('departments').doc(deptRef2.id).update({ headId: dianaRef.id });
  console.log(`✅ Department heads assigned: Engineering -> Charlie, HR -> Diana`);

  // ---- 4. ASSETS (8) with mixed statuses ----
  const assetData = [
    { name: 'Laptop Pro X', categoryId: catRef1.id, serialNumber: 'SN001', condition: 'Good', location: 'Floor 2', status: 'Available' },
    { name: 'Office Desk', categoryId: catRef2.id, serialNumber: 'SN002', condition: 'Good', location: 'Room A', status: 'Allocated' },
    { name: 'Company Van', categoryId: catRef3.id, serialNumber: 'SN003', condition: 'Fair', location: 'Parking', status: 'Under Maintenance' },
    { name: 'Monitor 24"', categoryId: catRef1.id, serialNumber: 'SN004', condition: 'Good', location: 'Floor 3', status: 'Available' },
    { name: 'Conference Table', categoryId: catRef2.id, serialNumber: 'SN005', condition: 'Good', location: 'Meeting Room', status: 'Retired' },
    { name: 'MacBook Air', categoryId: catRef1.id, serialNumber: 'SN006', condition: 'Excellent', location: 'Floor 1', status: 'Allocated' },
    { name: 'Printer HP', categoryId: catRef1.id, serialNumber: 'SN007', condition: 'Poor', location: 'Floor 2', status: 'Under Maintenance' },
    { name: 'Delivery Scooter', categoryId: catRef3.id, serialNumber: 'SN008', condition: 'Good', location: 'Parking', status: 'Available' },
  ];

  // We need to auto-generate Asset Tags: AF-0001 to AF-0008.
  // In real registerAsset() we count existing, but for seed we just hardcode.
  for (let i = 0; i < assetData.length; i++) {
    const asset = assetData[i];
    const tag = `AF-${String(i + 1).padStart(4, '0')}`; // AF-0001, AF-0002...
    await db.collection('assets').add({
      ...asset,
      assetTag: tag,
      acquisitionDate: new Date('2025-01-01'),
      acquisitionCost: 1000 + (i * 100),
      sharedBookable: false,
      allocatedToId: null, // we'll set one for Allocated ones
    });
    console.log(`✅ Asset created: ${tag} - ${asset.name} (${asset.status})`);
  }

  // ---- For the 2 "Allocated" assets (AF-0002 and AF-0006), link them to employees ----
  // AF-0002 -> allocate to Diana
  // AF-0006 -> allocate to Eve
  const assetsSnapshot = await db.collection('assets').where('status', '==', 'Allocated').get();
  let counter = 0;
  for (const doc of assetsSnapshot.docs) {
    const emp = counter === 0 ? employeeRefs.find(e => e.name === 'Diana Employee').ref : employeeRefs.find(e => e.name === 'Eve Employee').ref;
    await db.collection('assets').doc(doc.id).update({
      allocatedToId: emp.id,
    });
    // Also create an allocation record (this is needed for the "overdue" query later)
    await db.collection('allocations').add({
      assetId: doc.id,
      employeeId: emp.id,
      departmentId: employeeRefs.find(e => e.ref.id === emp.id).ref.departmentId || null,
      allocatedAt: new Date('2026-06-01'),
      expectedReturnDate: new Date('2026-07-01'), // some overdue, some not
      status: 'Active', // Active, Returned, Overdue
    });
    counter++;
  }

  console.log('✅ Allocation records created for AF-0002 and AF-0006');

  // ---- Also create a few bookings for the resource booking test ----
  // Book Room? But we don't have a "room" asset. We'll use "Conference Table" (AF-0005) which is Retired, better use AF-0008 (Scooter).
  // For demo, let's book AF-0008 (Delivery Scooter) for 9:00-10:00 today.
  const scooterSnapshot = await db.collection('assets').where('assetTag', '==', 'AF-0008').get();
  let scooterId = null;
  scooterSnapshot.forEach(doc => { scooterId = doc.id; });
  if (scooterId) {
    const now = new Date();
    const start9 = new Date(now);
    start9.setHours(9, 0, 0, 0);
    const end10 = new Date(now);
    end10.setHours(10, 0, 0, 0);
    await db.collection('bookings').add({
      assetId: scooterId,
      bookedBy: employeeRefs.find(e => e.name === 'Diana Employee').ref.id,
      startTime: start9,
      endTime: end10,
      status: 'Upcoming', // Upcoming, Ongoing, Completed, Cancelled
      createdAt: new Date(),
    });
    console.log(`✅ Booking created for AF-0008: 9:00-10:00 (Upcoming)`);
  }

  console.log('🎉 Seed completed successfully!');
}

// Run it
seed().catch(console.error);