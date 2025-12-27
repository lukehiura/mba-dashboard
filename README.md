# MBA Program Analysis Dashboard

An interactive dashboard for analyzing and comparing top MBA programs from 1990-2025.

## Features

- **Historical Rankings Analysis**: Track how MBA programs have evolved over 35 years (1990-2025)
- **Employment Statistics**: Deep dive into placement rates, salaries, and career outcomes
- **School Comparisons**: Side-by-side comparisons of top MBA programs
- **Industry & Function Analysis**: Understand where graduates go by industry and role
- **Salary Trends**: Visualize compensation trends over time
- **School Specializations**: Identify what each program excels at

## Data Sources

- U.S. News MBA Rankings (1990-2025)
- Employment reports from:
  - Stanford GSB
  - Harvard Business School
  - Wharton
  - Chicago Booth
  - MIT Sloan
  - Kellogg
  - Columbia Business School
  - NYU Stern
  - Berkeley Haas
  - Dartmouth Tuck
  - Yale SOM

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone [repository-url]

# Navigate to the dashboard directory
cd "Dashboard MBA"

# Install dependencies
npm install

# Start the development server
npm start
```

The application will open at `http://localhost:3000`

## Dashboard Sections

### 1. Rankings Evolution
- Line charts showing ranking changes over 35 years
- Identify consistent performers vs. risers/fallers
- Filter by time period and school

### 2. Employment Outcomes
- Placement rates by school
- Median and mean salaries
- Signing bonuses
- Performance bonuses

### 3. Industry Analysis
- Top industries by school
- Salary comparisons by industry
- Hiring trends over time

### 4. Function Analysis
- Popular career functions (Consulting, Finance, Tech, etc.)
- Compensation by function
- School strengths by function

### 5. School Comparison Tool
- Compare up to 5 schools simultaneously
- Metrics include: rankings, salaries, placement rates, GMAT scores
- Interactive charts and tables

### 6. Specialization Insights
- Identify schools known for specific industries/functions
- Data-driven recommendations
- Historical trends

## Technology Stack

- **Frontend**: React 18
- **UI Components**: Material-UI
- **Data Visualization**: Recharts, D3.js
- **Routing**: React Router
- **Data Processing**: PapaParse (CSV parsing)

## Data Structure

```
/data
├── mba_rankings_1990_2025.csv
├── employment_by_function.csv
├── employment_by_industry.csv
├── school_summary.csv
└── THE World University Rankings 2016-2026.csv
```

## Contributing

This is an educational project. Feel free to fork and modify for your own use.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Data compiled from official MBA employment reports
- U.S. News & World Report for rankings data
- Times Higher Education for university rankings

