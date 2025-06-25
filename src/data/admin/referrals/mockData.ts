// Enhanced interfaces for comprehensive analytics
export interface ReferralAnalytics {
  id: string;
  referrer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    referralCode: string;
    avatar?: string;
  };
  referred: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  date: string;
  status: "Pending" | "Completed" | "Expired" | "Cancelled";
  reward: number;
  rewardStatus: "Pending" | "Paid" | "Processing";
  conversionDate?: string;
  source?: "WhatsApp" | "Facebook" | "Instagram" | "Email" | "Direct";
  region?: string;
  orderAmount?: number;
  commissionRate?: number;
}

export interface TopReferrer {
  id: string;
  name: string;
  referralCode: string;
  referredUsers: number;
  referralOrders: number;
  revenueGenerated: number;
  commission: number;
  avatar?: string;
  rank: number;
}

export interface CommissionPayout {
  referrerId: string;
  referrerName: string;
  commissionEarned: number;
  paid: number;
  pending: number;
  lastPayout: string;
  payoutMethod: "Bank Transfer" | "Wallet Credit" | "PayPal";
  avatar?: string;
}

export interface ReferralEvent {
  date: string;
  referrer: string;
  referredUser: string;
  action: "Click" | "Signup" | "Purchase";
  commission: number;
  orderAmount?: number;
}

// Mock data for comprehensive analytics
export const referralAnalytics: ReferralAnalytics[] = [
  {
    id: "REF001",
    referrer: {
      id: "CUST001",
      name: "Chinedu Okafor",
      email: "chinedu.okafor@example.com",
      phone: "+234 803 123 4567",
      referralCode: "CHINEDU234"
    },
    referred: {
      id: "CUST002",
      name: "Aisha Bello",
      email: "aisha.bello@example.com",
      phone: "+234 802 987 6543"
    },
    date: "2024-03-15",
    status: "Completed",
    reward: 5000.00,
    rewardStatus: "Paid",
    conversionDate: "2024-03-20",
    source: "WhatsApp",
    region: "Lagos",
    orderAmount: 50000,
    commissionRate: 10
  },
  {
    id: "REF002",
    referrer: {
      id: "CUST003",
      name: "Emeka Umeh",
      email: "emeka.umeh@example.com",
      phone: "+234 805 555 6666",
      referralCode: "EMEKA456"
    },
    referred: {
      id: "CUST004",
      name: "Ngozi Nwosu",
      email: "ngozi.nwosu@example.com",
      phone: "+234 809 111 2222"
    },
    date: "2024-03-10",
    status: "Pending",
    reward: 5000.00,
    rewardStatus: "Pending",
    source: "Facebook",
    region: "Abuja",
    orderAmount: 50000,
    commissionRate: 10
  },
  {
    id: "REF003",
    referrer: {
      id: "CUST002",
      name: "Aisha Bello",
      email: "aisha.bello@example.com",
      phone: "+234 802 987 6543",
      referralCode: "AISHA789"
    },
    referred: {
      id: "CUST005",
      name: "Tunde Balogun",
      email: "tunde.balogun@example.com",
      phone: "+234 807 333 4444"
    },
    date: "2024-03-05",
    status: "Expired",
    reward: 5000.00,
    rewardStatus: "Pending",
    source: "Instagram",
    region: "Port Harcourt"
  }
];

export const topReferrers: TopReferrer[] = [
  {
    id: "CUST001",
    name: "Chinedu Okafor",
    referralCode: "CHINEDU234",
    referredUsers: 54,
    referralOrders: 37,
    revenueGenerated: 2560000,
    commission: 128000,
    rank: 1
  },
  {
    id: "CUST002",
    name: "Aisha Bello",
    referralCode: "AISHA789",
    referredUsers: 41,
    referralOrders: 29,
    revenueGenerated: 1980000,
    commission: 99000,
    rank: 2
  },
  {
    id: "CUST003",
    name: "Emeka Umeh",
    referralCode: "EMEKA456",
    referredUsers: 38,
    referralOrders: 25,
    revenueGenerated: 1750000,
    commission: 87500,
    rank: 3
  },
  {
    id: "CUST004",
    name: "Ngozi Nwosu",
    referralCode: "NGOZI321",
    referredUsers: 32,
    referralOrders: 22,
    revenueGenerated: 1450000,
    commission: 72500,
    rank: 4
  },
  {
    id: "CUST005",
    name: "Tunde Balogun",
    referralCode: "TUNDE101",
    referredUsers: 28,
    referralOrders: 19,
    revenueGenerated: 1200000,
    commission: 60000,
    rank: 5
  }
];

export const commissionPayouts: CommissionPayout[] = [
  {
    referrerId: "CUST001",
    referrerName: "Chinedu Okafor",
    commissionEarned: 180000,
    paid: 150000,
    pending: 30000,
    lastPayout: "2024-06-05",
    payoutMethod: "Bank Transfer"
  },
  {
    referrerId: "CUST002",
    referrerName: "Aisha Bello",
    commissionEarned: 110000,
    paid: 100000,
    pending: 10000,
    lastPayout: "2024-06-03",
    payoutMethod: "Wallet Credit"
  },
  {
    referrerId: "CUST003",
    referrerName: "Emeka Umeh",
    commissionEarned: 95000,
    paid: 80000,
    pending: 15000,
    lastPayout: "2024-06-01",
    payoutMethod: "Bank Transfer"
  }
];

export const referralEvents: ReferralEvent[] = [
  {
    date: "2024-06-17",
    referrer: "Chinedu Okafor",
    referredUser: "Tunde Balogun",
    action: "Purchase",
    commission: 5000,
    orderAmount: 50000
  },
  {
    date: "2024-06-17",
    referrer: "Aisha Bello",
    referredUser: "Ngozi Nwosu",
    action: "Signup",
    commission: 0
  },
  {
    date: "2024-06-16",
    referrer: "Emeka Umeh",
    referredUser: "Chinedu Okafor",
    action: "Purchase",
    commission: 3000,
    orderAmount: 30000
  }
];

// Chart data for performance metrics
export const performanceData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  referredUsers: [120, 150, 180, 220, 280, 320],
  referralOrders: [85, 110, 130, 160, 200, 240],
  revenue: [850000, 1100000, 1300000, 1600000, 2000000, 2400000],
  commissions: [85000, 110000, 130000, 160000, 200000, 240000]
};

export const sourceBreakdown = [
  { source: "WhatsApp", count: 45, percentage: 45 },
  { source: "Facebook", count: 25, percentage: 25 },
  { source: "Instagram", count: 20, percentage: 20 },
  { source: "Email", count: 7, percentage: 7 },
  { source: "Direct", count: 3, percentage: 3 }
];

export const regionalData = [
  { region: "Lagos", referrals: 45, revenue: 2250000 },
  { region: "Abuja", referrals: 32, revenue: 1600000 },
  { region: "Port Harcourt", referrals: 28, revenue: 1400000 },
  { region: "Kano", referrals: 22, revenue: 1100000 },
  { region: "Others", referrals: 15, revenue: 750000 }
]; 