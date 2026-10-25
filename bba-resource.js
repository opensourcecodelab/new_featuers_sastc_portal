/**
 * Business Administration (BBA) Department Academic Resources Data (SASTC Portal)
 *
 * Instructions for adding/updating resources:
 * - Provide your exact image URL in `thumbnail` (Direct image link or Google Drive image link).
 * - Provide your exact document link in `url` (Google Drive file/folder link or direct PDF link).
 * - Supported categories:
 *   "Question Bank" | "Lecture Notes" | "Reference Books" | "Lab Materials" | "Previous Questions" | "More"
 * - Levels: "1", "2", "3", "4"
 * - Semesters: "1", "2"
 */

export const bbaResourceData = {
  "1": {
    "1": [
      {
        id: "bba-mgt101-ln-1",
        courseCode: "MGT 101",
        courseTitle: "Principles of Management",
        title: "Principles of Management Complete Lecture Notes & Case Studies",
        category: "Lecture Notes",
        level: "1",
        semester: "1",
        fileType: "PDF",
        tags: ["MGT 101", "Management", "Planning", "Organizing", "Leadership", "Lecture Notes", "L1S1"],
        thumbnail: "",
        url: "",
        details: "Classical and modern management theories, planning, SWOT analysis, organizational structure, leadership styles, and controlling.",
        author: "Dept. of Management",
        pages: "",
        size: "",
        session: "L1 S1"
      },
      {
        id: "bba-act101-qb-1",
        courseCode: "ACT 101",
        courseTitle: "Financial Accounting",
        title: "ACT 101 Financial Accounting Math & Journal Question Bank",
        category: "Question Bank",
        level: "1",
        semester: "1",
        fileType: "PDF",
        tags: ["ACT 101", "Financial Accounting", "Balance Sheet", "Trial Balance", "Question Bank"],
        thumbnail: "",
        url: "",
        details: "Solved accounting equation problems, journal entries, ledger posting, adjusting entries, worksheet, and financial statements.",
        author: "Dept. of Accounting",
        pages: "",
        size: "",
        session: "L1 S1"
      },
      {
        id: "bba-eng101-ref-1",
        courseCode: "ENG 101",
        courseTitle: "Business Communication",
        title: "Business Communication Report Writing & Correspondence Guide",
        category: "Reference Books",
        level: "1",
        semester: "1",
        fileType: "PDF",
        tags: ["ENG 101", "Business Communication", "Memos", "Business Letters", "Reference Books"],
        thumbnail: "",
        url: "",
        details: "Models of business communication, formal business letters, memorandums, executive reports, and corporate presentations.",
        author: "Faculty of Business Studies",
        pages: "",
        size: "",
        session: "L1 S1"
      },
      {
        id: "bba-l1s1-pq-1",
        courseCode: "MGT 101",
        courseTitle: "All BBA L1S1 Courses",
        title: "BBA Level 1 Semester 1 Previous Final Exam Question Papers",
        category: "Previous Questions",
        level: "1",
        semester: "1",
        fileType: "PDF",
        tags: ["MGT 101", "ACT 101", "ENG 101", "Previous Questions", "BBA L1S1"],
        thumbnail: "",
        url: "",
        details: "Archive of previous semester final examination papers for Principles of Management, Financial Accounting, and Business Communication.",
        author: "SASTC BBA Archive",
        pages: "",
        size: "",
        session: "Previous Batches"
      },
      {
        id: "bba-l1s1-more-1",
        courseCode: "ACT 101",
        courseTitle: "Computer Applications in Business",
        title: "Spreadsheet Modeling & Financial Accounting Templates",
        category: "Lab Materials",
        level: "1",
        semester: "1",
        fileType: "PDF",
        tags: ["ACT 101", "Excel", "Lab Materials", "Financial Modeling", "BBA"],
        thumbnail: "",
        url: "",
        details: "Practical spreadsheet formulas, financial statement templates, and presentation guidelines for BBA students.",
        author: "Faculty of Business Studies",
        pages: "",
        size: "",
        session: "L1 S1"
      }
    ],
    "2": [
      {
        id: "bba-mkt151-ln-1",
        courseCode: "MKT 151",
        courseTitle: "Principles of Marketing",
        title: "Principles of Marketing (4Ps, STP & Consumer Behavior) Notes",
        category: "Lecture Notes",
        level: "1",
        semester: "2",
        fileType: "PDF",
        tags: ["MKT 151", "Marketing", "STP", "Marketing Mix", "Lecture Notes", "L1S2"],
        thumbnail: "",
        url: "",
        details: "Market segmentation, targeting, positioning (STP), product lifecycle, pricing strategies, distribution channels, and promotion.",
        author: "Dept. of Marketing",
        pages: "",
        size: "",
        session: "L1 S2"
      },
      {
        id: "bba-fin151-qb-1",
        courseCode: "FIN 151",
        courseTitle: "Principles of Finance",
        title: "FIN 151 Time Value of Money & Capital Budgeting Question Bank",
        category: "Question Bank",
        level: "1",
        semester: "2",
        fileType: "PDF",
        tags: ["FIN 151", "Finance", "Time Value of Money", "NPV", "IRR", "Question Bank"],
        thumbnail: "",
        url: "",
        details: "Solved financial math problems on present/future value, annuities, bond/stock valuation, risk & return, and capital budgeting.",
        author: "Dept. of Finance",
        pages: "",
        size: "",
        session: "L1 S2"
      },
      {
        id: "bba-eco151-ref-1",
        courseCode: "ECO 151",
        courseTitle: "Microeconomics",
        title: "Microeconomics Demand-Supply, Elasticity & Market Structure Notes",
        category: "Reference Books",
        level: "1",
        semester: "2",
        fileType: "PDF",
        tags: ["ECO 151", "Microeconomics", "Elasticity", "Monopoly", "Reference Books"],
        thumbnail: "",
        url: "",
        details: "Consumer utility theory, production functions, cost curves, perfect competition, monopoly, and oligopoly models.",
        author: "Faculty of Business Studies",
        pages: "",
        size: "",
        session: "L1 S2"
      }
    ]
  },
  "2": {
    "1": [
      {
        id: "bba-hrm201-ln-1",
        courseCode: "HRM 201",
        courseTitle: "Human Resource Management",
        title: "HRM Recruitment, Training & Performance Appraisal Notes",
        category: "Lecture Notes",
        level: "2",
        semester: "1",
        fileType: "PDF",
        tags: ["HRM 201", "Human Resource", "Job Analysis", "Compensation", "Lecture Notes"],
        thumbnail: "",
        url: "",
        details: "HR planning, job analysis, talent acquisition, training and development, performance evaluation, and labor relations.",
        author: "Dept. of Management",
        pages: "",
        size: "",
        session: "L2 S1"
      },
      {
        id: "bba-act201-qb-1",
        courseCode: "ACT 201",
        courseTitle: "Management Accounting",
        title: "ACT 201 CVP Analysis, Budgeting & Costing Question Bank",
        category: "Question Bank",
        level: "2",
        semester: "1",
        fileType: "PDF",
        tags: ["ACT 201", "Management Accounting", "CVP", "Break Even", "Question Bank"],
        thumbnail: "",
        url: "",
        details: "Cost classification, absorption vs. variable costing, cost-volume-profit (CVP) math, master budgeting, and variance analysis.",
        author: "Dept. of Accounting",
        pages: "",
        size: "",
        session: "L2 S1"
      }
    ],
    "2": [
      {
        id: "bba-mgt251-ln-1",
        courseCode: "MGT 251",
        courseTitle: "Organizational Behavior",
        title: "Organizational Behavior Motivation, Group Dynamics & Culture Notes",
        category: "Lecture Notes",
        level: "2",
        semester: "2",
        fileType: "PDF",
        tags: ["MGT 251", "Organizational Behavior", "Motivation", "Leadership", "Lecture Notes"],
        thumbnail: "",
        url: "",
        details: "Individual behavior, personality, perception, motivation theories, team building, conflict resolution, and organizational change.",
        author: "Dept. of Management",
        pages: "",
        size: "",
        session: "L2 S2"
      },
      {
        id: "bba-fin251-qb-1",
        courseCode: "FIN 251",
        courseTitle: "Corporate Finance",
        title: "FIN 251 Cost of Capital, Leverage & Dividend Policy Question Bank",
        category: "Question Bank",
        level: "2",
        semester: "2",
        fileType: "PDF",
        tags: ["FIN 251", "Corporate Finance", "WACC", "Capital Structure", "Question Bank"],
        thumbnail: "",
        url: "",
        details: "Solved problems on WACC, operating and financial leverage, MM theorem, dividend policy, and working capital management.",
        author: "Dept. of Finance",
        pages: "",
        size: "",
        session: "L2 S2"
      }
    ]
  },
  "3": {
    "1": [
      {
        id: "bba-sta301-qb-1",
        courseCode: "STA 301",
        courseTitle: "Business Statistics",
        title: "STA 301 Probability, Hypothesis Testing & Regression Question Bank",
        category: "Question Bank",
        level: "3",
        semester: "1",
        fileType: "PDF",
        tags: ["STA 301", "Business Statistics", "Probability", "Regression", "Hypothesis Testing", "Question Bank"],
        thumbnail: "",
        url: "",
        details: "Probability distributions, sampling, confidence intervals, Z/t/Chi-square tests, correlation, and linear regression.",
        author: "Faculty of Business Studies",
        pages: "",
        size: "",
        session: "L3 S1"
      },
      {
        id: "bba-mkt301-ln-1",
        courseCode: "MKT 301",
        courseTitle: "Marketing Management",
        title: "MKT 301 & MGT 301 Marketing Management and Business Law Notes",
        category: "Lecture Notes",
        level: "3",
        semester: "1",
        fileType: "PDF",
        tags: ["MKT 301", "MGT 301", "Marketing Management", "Business Law", "Contract Act", "Lecture Notes"],
        thumbnail: "",
        url: "",
        details: "Strategic brand management, competitive marketing strategies, Law of Contract, Sale of Goods Act, and Company Law.",
        author: "Faculty of Business Studies",
        pages: "",
        size: "",
        session: "L3 S1"
      }
    ],
    "2": [
      {
        id: "bba-mgt351-ln-1",
        courseCode: "MGT 351",
        courseTitle: "Operations Management",
        title: "Operations Management Supply Chain, Inventory & TQM Notes",
        category: "Lecture Notes",
        level: "3",
        semester: "2",
        fileType: "PDF",
        tags: ["MGT 351", "Operations Management", "EOQ", "Supply Chain", "TQM", "Lecture Notes"],
        thumbnail: "",
        url: "",
        details: "Forecasting, facility layout, capacity planning, EOQ inventory models, MRP, and statistical quality control.",
        author: "Dept. of Management",
        pages: "",
        size: "",
        session: "L3 S2"
      },
      {
        id: "bba-fin351-qb-1",
        courseCode: "FIN 351",
        courseTitle: "Financial Markets and Institutions",
        title: "FIN 351 Money Market, Capital Market & Banking Question Bank",
        category: "Question Bank",
        level: "3",
        semester: "2",
        fileType: "PDF",
        tags: ["FIN 351", "Financial Markets", "Capital Market", "Central Bank", "Question Bank"],
        thumbnail: "",
        url: "",
        details: "Money market instruments, stock exchange operations, mutual funds, commercial bank management, and regulatory frameworks.",
        author: "Dept. of Finance",
        pages: "",
        size: "",
        session: "L3 S2"
      }
    ]
  },
  "4": {
    "1": [
      {
        id: "bba-mgt401-ln-1",
        courseCode: "MGT 401",
        courseTitle: "Strategic Management",
        title: "Strategic Management Porter's Five Forces & Corporate Strategy Notes",
        category: "Lecture Notes",
        level: "4",
        semester: "1",
        fileType: "PDF",
        tags: ["MGT 401", "BUS 401", "Strategic Management", "International Business", "Lecture Notes"],
        thumbnail: "",
        url: "",
        details: "Competitive advantage, industry analysis, BCG matrix, corporate diversification, and global market entry strategies.",
        author: "Dept. of Management",
        pages: "",
        size: "",
        session: "L4 S1"
      }
    ],
    "2": [
      {
        id: "bba-mgt451-ln-1",
        courseCode: "MGT 451",
        courseTitle: "Entrepreneurship Development & Business Ethics",
        title: "MGT 451 & BUS 451 Business Plan, Venture Capital & CSR Notes",
        category: "More",
        level: "4",
        semester: "2",
        fileType: "PDF",
        tags: ["MGT 451", "BUS 451", "Entrepreneurship", "Business Ethics", "CSR", "More"],
        thumbnail: "",
        url: "",
        details: "Business plan formulation, startup financing, feasibility analysis, corporate governance, and corporate social responsibility.",
        author: "Faculty of Business Studies",
        pages: "",
        size: "",
        session: "L4 S2"
      }
    ]
  }
};

export default bbaResourceData;
