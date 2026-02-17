# 🖨️ Printing Press Management – Admin Dashboard Module

## 📘 Overview

The **Printing Press tab** on the admin dashboard serves as a centralized control room for everything happening within the printing operations of the publishing company. It allows the admin (or MD) to oversee and manage:

- All printing requests and their status  
- Books that have been printed and dispatched  
- Maintenance and repair logs for machines  
- Printing press staff and operators  
- Additional activities such as print cost tracking or machine usage  

This module is divided into **structured tabs** within the Printing Press page to keep the UI clean and professionally organized.

---

## 🧭 Tab Structure

| Tab Name                  | Route                             | Purpose                                        |
|---------------------------|------------------------------------|------------------------------------------------|
| 🖨️ Print Jobs             | `/admin/printing/print-jobs`       | Manage all print requests                      |
| 📦 Dispatch               | `/admin/printing/dispatch`         | Track sent-out printed books                   |
| 🛠️ Repairs & Maintenance | `/admin/printing/repairs`          | Log and monitor machine maintenance & expenses |
| 👷 Workers                | `/admin/printing/workers`          | Manage printing press staff                    |
| 📈 Print Analytics        | `/admin/printing/analytics`        | Charts and insights (optional)                 |

---

## 📄 Tab Descriptions

### 1. 🖨️ Print Jobs Tab

This is the default tab.

**Key Features:**
- KPI cards: Total requests, Completed, Pending, In Progress
- Filter bar (book, status, printer, date range)
- Print Jobs table:
  - Print ID
  - Book Title
  - Quantity
  - Format (e.g., soft cover, braille)
  - Assigned Printer
  - Status: Pending, Printing, Completed
  - Requested By
  - Dates
  - Actions: View, Reassign, Complete, Cancel
- View Details Modal: includes full metadata and attached files (if any)

---

### 2. 📦 Dispatch Tab

Tracks and manages **books that have been printed and sent out**.

**Table Columns:**
- Dispatch ID  
- Book Title  
- Quantity  
- Destination (Person, School, or Warehouse)  
- State/Location  
- Dispatch Date  
- Transporter Name  
- Vehicle Number  
- Delivery Note (upload/view)  
- Status: In Transit, Delivered, Failed  

**Admin Actions:**
- Update delivery status  
- Upload dispatch note  
- View delivery history  

---

### 3. 🛠️ Repairs & Maintenance Tab

Monitors machine repair history, faults, and costs.

**Table Columns:**
- Repair ID  
- Machine Name  
- Fault Description  
- Logged By  
- Date Reported  
- Status: Pending, In Progress, Fixed  
- Assigned Technician  
- Repair Cost (₦)  
- Notes / Invoice  

**Admin Actions:**
- Log new repair issue  
- Assign technician  
- Upload receipts/invoices  
- Update repair status  

---

### 4. 👷 Workers Tab

Overview of all printing staff.

**Table Columns:**
- Full Name  
- Role (e.g. Operator, Cleaner)  
- Phone/Email  
- Shift Assignment  
- Date Joined  
- Status: Active, On Leave, Resigned  
- Profile Picture  

**Admin Actions:**
- Add/Edit Worker Profile  
- Assign to printer or machine  
- View individual job history or shift calendar (optional)  

---

### 5. 📈 Print Analytics Tab (Optional)

Visual charts and statistics.

**Charts to Include:**
- Monthly print volumes  
- Book types by volume  
- Top 5 books printed  
- Machine usage rate  
- Average turnaround time  
- Number of repair logs per machine  

---

## 🚧 Phased Development Plan

### Phase 1: Print Jobs Tab
- Setup layout with tabs  
- Build KPI summary cards  
- Create filters + main table with sample records  
- View Details modal and record actions  
- Seed mock data  

---

### Phase 2: Dispatch Tab
- Create dispatch table  
- Add form to log dispatch info  
- Modal for dispatch details  
- Add upload capability for delivery notes  
- Mock records for testing  

---

### Phase 3: Repairs & Maintenance
- Create repairs log table  
- Add repair form modal  
- Assign technician and cost fields  
- Add status updater  
- Setup mock dataset  

---

### Phase 4: Workers
- Table of all staff  
- Modal for Add/Edit staff info  
- Assign to machines or tasks  
- Optionally: shift calendar or weekly planner  

---

### Phase 5: Print Analytics (Optional)
- Build charts with mock print history data  
- Add filtering options (e.g., by printer, format, month)  
- Display key stats summary  

---

## 📁 Suggested Folder Structure

