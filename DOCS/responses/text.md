data: {
    {
        "referralAnalytics": [
          {
            "id": "REF001",
            "referrer": {
              "id": "CUST001",
              "name": "John Doe",
              "email": "john@example.com",
              "phone": "+234 123 456 7890",
              "referralCode": "JOHN123",
              "avatar": null
            },
            "referred": {
              "id": "CUST002",
              "name": "Jane Smith",
              "email": "jane@example.com",
              "phone": "+234 987 654 3210",
              "avatar": null
            },
            "date": "2024-03-15",
            "status": "Completed",
            "reward": 5000,
            "rewardStatus": "Paid",
            "conversionDate": "2024-03-20",
            "source": "WhatsApp",
            "region": "Lagos",
            "orderAmount": 50000,
            "commissionRate": 10
          },
          {
            "id": "REF002",
            "referrer": {
              "id": "CUST003",
              "name": "Mike Johnson",
              "email": "mike@example.com",
              "phone": "+234 555 666 7777",
              "referralCode": "MIKE456",
              "avatar": null
            },
            "referred": {
              "id": "CUST004",
              "name": "Sarah Williams",
              "email": "sarah@example.com",
              "phone": "+234 111 222 3333",
              "avatar": null
            },
            "date": "2024-03-10",
            "status": "Pending",
            "reward": 5000,
            "rewardStatus": "Pending",
            "source": "Facebook",
            "region": "Abuja",
            "orderAmount": 50000,
            "commissionRate": 10
          },
          {
            "id": "REF003",
            "referrer": {
              "id": "CUST002",
              "name": "Jane Smith",
              "email": "jane@example.com",
              "phone": "+234 987 654 3210",
              "referralCode": "JANE789",
              "avatar": null
            },
            "referred": {
              "id": "CUST005",
              "name": "David Brown",
              "email": "david@example.com",
              "phone": "+234 333 444 5555",
              "avatar": null
            },
            "date": "2024-03-05",
            "status": "Expired",
            "reward": 5000,
            "rewardStatus": "Pending",
            "source": "Instagram",
            "region": "Port Harcourt"
          }
        ],
        "topReferrers": [
          {
            "id": "CUST001",
            "name": "John Doe",
            "referralCode": "JOHN123",
            "referredUsers": 54,
            "referralOrders": 37,
            "revenueGenerated": 2560000,
            "commission": 128000,
            "avatar": null,
            "rank": 1
          },
          {
            "id": "CUST002",
            "name": "Jane Fox",
            "referralCode": "BOOKQUEEN",
            "referredUsers": 41,
            "referralOrders": 29,
            "revenueGenerated": 1980000,
            "commission": 99000,
            "avatar": null,
            "rank": 2
          },
          {
            "id": "CUST003",
            "name": "Mike Johnson",
            "referralCode": "MIKE456",
            "referredUsers": 38,
            "referralOrders": 25,
            "revenueGenerated": 1750000,
            "commission": 87500,
            "avatar": null,
            "rank": 3
          },
          {
            "id": "CUST004",
            "name": "Sarah Williams",
            "referralCode": "SARAH789",
            "referredUsers": 32,
            "referralOrders": 22,
            "revenueGenerated": 1450000,
            "commission": 72500,
            "avatar": null,
            "rank": 4
          },
          {
            "id": "CUST005",
            "name": "David Brown",
            "referralCode": "DAVID101",
            "referredUsers": 28,
            "referralOrders": 19,
            "revenueGenerated": 1200000,
            "commission": 60000,
            "avatar": null,
            "rank": 5
          }
        ],
        "commissionPayouts": [
          {
            "referrerId": "CUST001",
            "referrerName": "John Doe",
            "commissionEarned": 180000,
            "paid": 150000,
            "pending": 30000,
            "lastPayout": "2024-06-05",
            "payoutMethod": "Bank Transfer",
            "avatar": null
          },
          {
            "referrerId": "CUST002",
            "referrerName": "Jane Fox",
            "commissionEarned": 110000,
            "paid": 100000,
            "pending": 10000,
            "lastPayout": "2024-06-03",
            "payoutMethod": "Wallet Credit",
            "avatar": null
          },
          {
            "referrerId": "CUST003",
            "referrerName": "Mike Johnson",
            "commissionEarned": 95000,
            "paid": 80000,
            "pending": 15000,
            "lastPayout": "2024-06-01",
            "payoutMethod": "Bank Transfer",
            "avatar": null
          }
        ],
        "referralEvents": [
          {
            "date": "2024-06-17",
            "referrer": "John Doe",
            "referredUser": "Emeka Umeh",
            "action": "Purchase",
            "commission": 5000,
            "orderAmount": 50000
          },
          {
            "date": "2024-06-17",
            "referrer": "Jane Fox",
            "referredUser": "Aisha Bello",
            "action": "Signup",
            "commission": 0
          },
          {
            "date": "2024-06-16",
            "referrer": "Mike Johnson",
            "referredUser": "Kemi Adebayo",
            "action": "Purchase",
            "commission": 3000,
            "orderAmount": 30000
          }
        ],
        "performanceData": {
          "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          "referredUsers": [120, 150, 180, 220, 280, 320],
          "referralOrders": [85, 110, 130, 160, 200, 240],
          "revenue": [850000, 1100000, 1300000, 1600000, 2000000, 2400000],
          "commissions": [85000, 110000, 130000, 160000, 200000, 240000]
        },
        "sourceBreakdown": [
          { "source": "WhatsApp", "count": 45, "percentage": 45 },
          { "source": "Facebook", "count": 25, "percentage": 25 },
          { "source": "Instagram", "count": 20, "percentage": 20 },
          { "source": "Email", "count": 7, "percentage": 7 },
          { "source": "Direct", "count": 3, "percentage": 3 }
        ],
        "regionalData": [
          { "region": "Lagos", "referrals": 45, "revenue": 2250000 },
          { "region": "Abuja", "referrals": 32, "revenue": 1600000 },
          { "region": "Port Harcourt", "referrals": 28, "revenue": 1400000 },
          { "region": "Kano", "referrals": 22, "revenue": 1100000 },
          { "region": "Others", "referrals": 15, "revenue": 750000 }
        ]
      }
}