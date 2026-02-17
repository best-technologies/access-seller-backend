// Printing Press Data Interfaces
export interface PrintJob {
  id: string;
  bookTitle: string;
  quantity: number;
  format: 'soft_cover' | 'hard_cover' | 'braille' | 'large_print' | 'digital';
  assignedPrinter: string;
  status: 'pending' | 'printing' | 'completed' | 'cancelled';
  requestedBy: string;
  requestedDate: string;
  startDate?: string;
  completedDate?: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  attachedFiles?: string[];
}

export interface Dispatch {
  id: string;
  bookTitle: string;
  quantity: number;
  destination: string;
  destinationType: 'person' | 'school' | 'warehouse';
  state: string;
  city: string;
  dispatchDate: string;
  transporterName: string;
  vehicleNumber: string;
  deliveryNote?: string;
  status: 'in_transit' | 'delivered' | 'failed';
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  trackingNumber?: string;
}

export interface Repair {
  id: string;
  machineName: string;
  faultDescription: string;
  loggedBy: string;
  dateReported: string;
  status: 'pending' | 'in_progress' | 'fixed';
  assignedTechnician?: string;
  repairCost: number;
  notes?: string;
  invoice?: string;
  startDate?: string;
  completionDate?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface Worker {
  id: string;
  fullName: string;
  role: 'operator' | 'cleaner' | 'supervisor' | 'technician' | 'assistant';
  phone: string;
  email: string;
  shiftAssignment: 'morning' | 'afternoon' | 'night' | 'flexible';
  dateJoined: string;
  status: 'active' | 'on_leave' | 'resigned';
  profilePicture?: string;
  assignedMachines?: string[];
  salary?: number;
  emergencyContact?: string;
}

export interface PrintAnalytics {
  monthlyPrintVolumes: {
    month: string;
    volume: number;
  }[];
  bookTypesByVolume: {
    type: string;
    volume: number;
    percentage: number;
  }[];
  topBooksPrinted: {
    title: string;
    copies: number;
    revenue: number;
  }[];
  machineUsageRate: {
    machine: string;
    usagePercentage: number;
    totalHours: number;
  }[];
  averageTurnaroundTime: number; // in hours
  repairLogsPerMachine: {
    machine: string;
    repairCount: number;
    totalCost: number;
  }[];
}

// Mock Data
export const printJobs: PrintJob[] = [
  {
    id: "PRINT001",
    bookTitle: "Mathematics for Primary Schools",
    quantity: 500,
    format: "soft_cover",
    assignedPrinter: "HP Indigo 7900",
    status: "completed",
    requestedBy: "Dr. Sarah Johnson",
    requestedDate: "2024-06-10",
    startDate: "2024-06-12",
    completedDate: "2024-06-15",
    priority: "high",
    notes: "Urgent order for new school term"
  },
  {
    id: "PRINT002",
    bookTitle: "English Literature Classics",
    quantity: 200,
    format: "hard_cover",
    assignedPrinter: "Canon imagePRESS C10000",
    status: "printing",
    requestedBy: "Prof. Michael Chen",
    requestedDate: "2024-06-12",
    startDate: "2024-06-14",
    priority: "medium",
    notes: "Premium quality binding required"
  },
  {
    id: "PRINT003",
    bookTitle: "Science Experiments Guide",
    quantity: 300,
    format: "soft_cover",
    assignedPrinter: "HP Indigo 7900",
    status: "pending",
    requestedBy: "Mrs. Aisha Bello",
    requestedDate: "2024-06-13",
    priority: "low",
    notes: "Include color diagrams"
  },
  {
    id: "PRINT004",
    bookTitle: "Braille Mathematics Textbook",
    quantity: 50,
    format: "braille",
    assignedPrinter: "Braille Embosser Pro",
    status: "printing",
    requestedBy: "Special Education Department",
    requestedDate: "2024-06-11",
    startDate: "2024-06-13",
    priority: "high",
    notes: "Accessibility requirement"
  },
  {
    id: "PRINT005",
    bookTitle: "History of Nigeria",
    quantity: 1000,
    format: "soft_cover",
    assignedPrinter: "Canon imagePRESS C10000",
    status: "pending",
    requestedBy: "National Curriculum Board",
    requestedDate: "2024-06-14",
    priority: "medium",
    notes: "Large order for nationwide distribution"
  },
  {
    id: "PRINT006",
    bookTitle: "Large Print Bible",
    quantity: 100,
    format: "large_print",
    assignedPrinter: "HP Indigo 7900",
    status: "completed",
    requestedBy: "Church of St. Mary",
    requestedDate: "2024-06-08",
    startDate: "2024-06-09",
    completedDate: "2024-06-12",
    priority: "medium",
    notes: "For elderly congregation members"
  }
];

export const dispatchRecords: Dispatch[] = [
  {
    id: "DISP001",
    bookTitle: "Mathematics for Primary Schools",
    quantity: 500,
    destination: "Lagos State Ministry of Education",
    destinationType: "school",
    state: "Lagos",
    city: "Ikeja",
    dispatchDate: "2024-06-16",
    transporterName: "Swift Logistics",
    vehicleNumber: "LAG-123-ABC",
    status: "delivered",
    expectedDeliveryDate: "2024-06-18",
    actualDeliveryDate: "2024-06-17",
    trackingNumber: "SWIFT-2024-001"
  },
  {
    id: "DISP002",
    bookTitle: "English Literature Classics",
    quantity: 200,
    destination: "University of Ibadan Library",
    destinationType: "school",
    state: "Oyo",
    city: "Ibadan",
    dispatchDate: "2024-06-15",
    transporterName: "Express Delivery Co.",
    vehicleNumber: "OYO-456-DEF",
    status: "in_transit",
    expectedDeliveryDate: "2024-06-20",
    trackingNumber: "EXP-2024-002"
  },
  {
    id: "DISP003",
    bookTitle: "Large Print Bible",
    quantity: 100,
    destination: "Church of St. Mary",
    destinationType: "person",
    state: "Rivers",
    city: "Port Harcourt",
    dispatchDate: "2024-06-13",
    transporterName: "Reliable Transport",
    vehicleNumber: "RIV-789-GHI",
    status: "delivered",
    expectedDeliveryDate: "2024-06-15",
    actualDeliveryDate: "2024-06-14",
    trackingNumber: "REL-2024-003"
  },
  {
    id: "DISP004",
    bookTitle: "Science Experiments Guide",
    quantity: 300,
    destination: "Central Warehouse",
    destinationType: "warehouse",
    state: "Kano",
    city: "Kano",
    dispatchDate: "2024-06-14",
    transporterName: "Northern Logistics",
    vehicleNumber: "KAN-012-JKL",
    status: "in_transit",
    expectedDeliveryDate: "2024-06-19",
    trackingNumber: "NOR-2024-004"
  }
];

export const repairLogs: Repair[] = [
  {
    id: "REP001",
    machineName: "HP Indigo 7900",
    faultDescription: "Paper jam in feeder unit",
    loggedBy: "John Smith",
    dateReported: "2024-06-15",
    status: "fixed",
    assignedTechnician: "Mike Johnson",
    repairCost: 25000,
    startDate: "2024-06-15",
    completionDate: "2024-06-16",
    priority: "medium",
    notes: "Replaced damaged feed rollers"
  },
  {
    id: "REP002",
    machineName: "Canon imagePRESS C10000",
    faultDescription: "Color calibration issues",
    loggedBy: "Sarah Wilson",
    dateReported: "2024-06-12",
    status: "in_progress",
    assignedTechnician: "David Brown",
    repairCost: 45000,
    startDate: "2024-06-13",
    priority: "high",
    notes: "Requires specialized calibration tools"
  },
  {
    id: "REP003",
    machineName: "Braille Embosser Pro",
    faultDescription: "Motor overheating",
    loggedBy: "Lisa Chen",
    dateReported: "2024-06-10",
    status: "fixed",
    assignedTechnician: "Alex Rodriguez",
    repairCost: 35000,
    startDate: "2024-06-11",
    completionDate: "2024-06-12",
    priority: "critical",
    notes: "Replaced motor and cooling system"
  },
  {
    id: "REP004",
    machineName: "HP Indigo 7900",
    faultDescription: "Ink system malfunction",
    loggedBy: "Robert Davis",
    dateReported: "2024-06-14",
    status: "pending",
    repairCost: 0,
    priority: "high",
    notes: "Awaiting technician availability"
  }
];

export const workers: Worker[] = [
  {
    id: "WRK001",
    fullName: "John Smith",
    role: "operator",
    phone: "+234-801-234-5678",
    email: "john.smith@printing.com",
    shiftAssignment: "morning",
    dateJoined: "2023-01-15",
    status: "active",
    assignedMachines: ["HP Indigo 7900"],
    salary: 150000,
    emergencyContact: "+234-802-345-6789"
  },
  {
    id: "WRK002",
    fullName: "Sarah Wilson",
    role: "supervisor",
    phone: "+234-803-456-7890",
    email: "sarah.wilson@printing.com",
    shiftAssignment: "afternoon",
    dateJoined: "2022-08-20",
    status: "active",
    assignedMachines: ["Canon imagePRESS C10000", "HP Indigo 7900"],
    salary: 200000,
    emergencyContact: "+234-804-567-8901"
  },
  {
    id: "WRK003",
    fullName: "Mike Johnson",
    role: "technician",
    phone: "+234-805-678-9012",
    email: "mike.johnson@printing.com",
    shiftAssignment: "flexible",
    dateJoined: "2023-03-10",
    status: "active",
    salary: 180000,
    emergencyContact: "+234-806-789-0123"
  },
  {
    id: "WRK004",
    fullName: "Lisa Chen",
    role: "operator",
    phone: "+234-807-890-1234",
    email: "lisa.chen@printing.com",
    shiftAssignment: "night",
    dateJoined: "2023-06-05",
    status: "active",
    assignedMachines: ["Braille Embosser Pro"],
    salary: 140000,
    emergencyContact: "+234-808-901-2345"
  },
  {
    id: "WRK005",
    fullName: "David Brown",
    role: "cleaner",
    phone: "+234-809-012-3456",
    email: "david.brown@printing.com",
    shiftAssignment: "morning",
    dateJoined: "2023-09-12",
    status: "on_leave",
    salary: 80000,
    emergencyContact: "+234-810-123-4567"
  }
];

export const printAnalytics: PrintAnalytics = {
  monthlyPrintVolumes: [
    { month: "Jan 2024", volume: 15000 },
    { month: "Feb 2024", volume: 18000 },
    { month: "Mar 2024", volume: 22000 },
    { month: "Apr 2024", volume: 19000 },
    { month: "May 2024", volume: 25000 },
    { month: "Jun 2024", volume: 28000 }
  ],
  bookTypesByVolume: [
    { type: "Soft Cover", volume: 45000, percentage: 60 },
    { type: "Hard Cover", volume: 20000, percentage: 27 },
    { type: "Braille", volume: 5000, percentage: 7 },
    { type: "Large Print", volume: 3000, percentage: 4 },
    { type: "Digital", volume: 2000, percentage: 2 }
  ],
  topBooksPrinted: [
    { title: "Mathematics for Primary Schools", copies: 5000, revenue: 2500000 },
    { title: "English Literature Classics", copies: 3000, revenue: 1800000 },
    { title: "Science Experiments Guide", copies: 2500, revenue: 1250000 },
    { title: "History of Nigeria", copies: 2000, revenue: 1000000 },
    { title: "Large Print Bible", copies: 1500, revenue: 750000 }
  ],
  machineUsageRate: [
    { machine: "HP Indigo 7900", usagePercentage: 85, totalHours: 680 },
    { machine: "Canon imagePRESS C10000", usagePercentage: 72, totalHours: 576 },
    { machine: "Braille Embosser Pro", usagePercentage: 45, totalHours: 360 }
  ],
  averageTurnaroundTime: 48, // hours
  repairLogsPerMachine: [
    { machine: "HP Indigo 7900", repairCount: 8, totalCost: 180000 },
    { machine: "Canon imagePRESS C10000", repairCount: 5, totalCost: 120000 },
    { machine: "Braille Embosser Pro", repairCount: 3, totalCost: 95000 }
  ]
};

// KPI Data for Print Jobs
export const printJobKPIs = {
  totalRequests: printJobs.length,
  completed: printJobs.filter(job => job.status === 'completed').length,
  pending: printJobs.filter(job => job.status === 'pending').length,
  inProgress: printJobs.filter(job => job.status === 'printing').length
}; 