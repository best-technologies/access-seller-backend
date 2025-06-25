// Enhanced interfaces for comprehensive analytics
export interface AffiliateAnalytics {
  id: string;
  affiliate: {
    id: string;
    name: string;
    email: string;
    phone: string;
    affiliateCode: string;
    avatar?: string;
  };
  affiliated: {
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

export interface TopAffiliate {
  id: string;
  name: string;
  affiliateCode: string;
  affiliatedUsers: number;
  affiliateOrders: number;
  revenueGenerated: number;
  commission: number;
  avatar?: string;
  rank: number;
}

export interface AffiliateEvent {
  date: string;
  affiliate: string;
  affiliatedUser: string;
  action: "Click" | "Signup" | "Purchase";
  commission: number;
  orderAmount?: number;
}

// Mock data for comprehensive analytics
export const affiliateAnalytics: AffiliateAnalytics[] = [
  {
    id: "AFF001",
    affiliate: {
      id: "CUST001",
      name: "Chinedu Okafor",
      email: "chinedu.okafor@example.com",
      phone: "+234 803 123 4567",
      affiliateCode: "CHINEDU234"
    },
    affiliated: {
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
    id: "AFF002",
    affiliate: {
      id: "CUST003",
      name: "Emeka Umeh",
      email: "emeka.umeh@example.com",
      phone: "+234 805 555 6666",
      affiliateCode: "EMEKA456"
    },
    affiliated: {
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
    id: "AFF003",
    affiliate: {
      id: "CUST002",
      name: "Aisha Bello",
      email: "aisha.bello@example.com",
      phone: "+234 802 987 6543",
      affiliateCode: "AISHA789"
    },
    affiliated: {
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

export const topAffiliates: TopAffiliate[] = [
  {
    id: "CUST001",
    name: "Chinedu Okafor",
    affiliateCode: "CHINEDU234",
    affiliatedUsers: 54,
    affiliateOrders: 37,
    revenueGenerated: 2560000,
    commission: 128000,
    rank: 1
  },
  {
    id: "CUST002",
    name: "Aisha Bello",
    affiliateCode: "AISHA789",
    affiliatedUsers: 41,
    affiliateOrders: 29,
    revenueGenerated: 1980000,
    commission: 99000,
    rank: 2
  },
  {
    id: "CUST003",
    name: "Emeka Umeh",
    affiliateCode: "EMEKA456",
    affiliatedUsers: 38,
    affiliateOrders: 25,
    revenueGenerated: 1750000,
    commission: 87500,
    rank: 3
  },
  {
    id: "CUST004",
    name: "Ngozi Nwosu",
    affiliateCode: "NGOZI321",
    affiliatedUsers: 32,
    affiliateOrders: 22,
    revenueGenerated: 1450000,
    commission: 72500,
    rank: 4
  },
  {
    id: "CUST005",
    name: "Tunde Balogun",
    affiliateCode: "TUNDE101",
    affiliatedUsers: 28,
    affiliateOrders: 19,
    revenueGenerated: 1200000,
    commission: 60000,
    rank: 5
  }
];

export const affiliateEvents: AffiliateEvent[] = [
  {
    date: "2024-06-17",
    affiliate: "Chinedu Okafor",
    affiliatedUser: "Tunde Balogun",
    action: "Purchase",
    commission: 5000,
    orderAmount: 50000
  },
  {
    date: "2024-06-17",
    affiliate: "Aisha Bello",
    affiliatedUser: "Ngozi Nwosu",
    action: "Signup",
    commission: 0
  },
  {
    date: "2024-06-16",
    affiliate: "Emeka Umeh",
    affiliatedUser: "Chinedu Okafor",
    action: "Purchase",
    commission: 3000,
    orderAmount: 30000
  }
];

export const regionalData = [
  { region: "Lagos", affiliates: 45, revenue: 2250000 },
  { region: "Abuja", affiliates: 32, revenue: 1600000 },
  { region: "Port Harcourt", affiliates: 28, revenue: 1400000 },
  { region: "Kano", affiliates: 22, revenue: 1100000 },
  { region: "Others", affiliates: 15, revenue: 750000 }
];

export const performanceData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  affiliatedUsers: [85, 110, 130, 160, 200, 240],
  affiliateOrders: [70, 90, 110, 140, 180, 220],
  revenue: [1200000, 1500000, 1800000, 2100000, 2500000, 3000000],
  commissions: [60000, 75000, 90000, 105000, 125000, 150000]
};

export const commissionPayouts = [
  {
    affiliateId: "CUST001",
    affiliateName: "Chinedu Okafor",
    commissionEarned: 128000,
    paid: 100000,
    pending: 28000,
    lastPayout: "2024-06-15",
    payoutMethod: "Bank Transfer"
  },
  {
    affiliateId: "CUST002",
    affiliateName: "Aisha Bello",
    commissionEarned: 99000,
    paid: 90000,
    pending: 9000,
    lastPayout: "2024-06-10",
    payoutMethod: "Bank Transfer"
  },
  {
    affiliateId: "CUST003",
    affiliateName: "Emeka Umeh",
    commissionEarned: 87500,
    paid: 80000,
    pending: 7500,
    lastPayout: "2024-06-12",
    payoutMethod: "Bank Transfer"
  }
];

export const sourceBreakdown = [
  { source: "WhatsApp", percentage: 35 },
  { source: "Facebook", percentage: 25 },
  { source: "Instagram", percentage: 20 },
  { source: "Email", percentage: 10 },
  { source: "Direct", percentage: 10 }
]; 