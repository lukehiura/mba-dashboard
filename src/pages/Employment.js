import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import Papa from 'papaparse';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

function Employment() {
  const [employmentData, setEmploymentData] = useState([]);
  const [industryData, setIndustryData] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [viewType, setViewType] = useState('function');

  useEffect(() => {
    Promise.all([
      fetch('/data/employment_by_function.csv').then(r => r.text()),
      fetch('/data/employment_by_industry.csv').then(r => r.text()),
    ]).then(([functionText, industryText]) => {
      Papa.parse(functionText, {
        header: true,
        complete: (results) => {
          const cleaned = results.data.filter(row => row.School && row.Year && row.Function && row.Percentage);
          setEmploymentData(cleaned);
          if (cleaned.length > 0 && !selectedSchool) {
            setSelectedSchool(cleaned[0].School);
          }
        },
      });
      Papa.parse(industryText, {
        header: true,
        complete: (results) => {
          const cleaned = results.data.filter(row => row.School && row.Year && row.Industry && row.Percentage);
          setIndustryData(cleaned);
        },
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set initial year when data loads
  useEffect(() => {
    if (employmentData.length > 0 && selectedSchool && !selectedYear) {
      const schoolYears = [...new Set(
        employmentData.filter(d => d.School === selectedSchool).map(d => d.Year)
      )].sort().reverse();
      if (schoolYears.length > 0) {
        setSelectedYear(schoolYears[0]);
      }
    }
  }, [employmentData, selectedSchool, selectedYear]);

  const schools = [...new Set(employmentData.map(d => d.School))].filter(Boolean).sort();
  const years = selectedSchool 
    ? [...new Set(employmentData.filter(d => d.School === selectedSchool).map(d => d.Year))].filter(Boolean).sort().reverse()
    : [];

  const getFilteredData = () => {
    const data = viewType === 'function' ? employmentData : industryData;
    return data.filter(d => d.School === selectedSchool && d.Year === selectedYear);
  };

  const getPieChartData = () => {
    const filtered = getFilteredData();
    // Normalize by aggregating similar categories
    const aggregated = {};
    
    filtered.forEach(d => {
      const category = viewType === 'function' ? d.Function : d.Industry;
      const pct = parseFloat(d.Percentage);
      
      if (category && !isNaN(pct) && pct > 0) {
        // Normalize category names
        let normalizedCategory = category;
        
        if (viewType === 'function') {
          // Consolidate consulting variations
          if (category.toLowerCase().includes('consult')) normalizedCategory = 'Consulting';
          else if (category.toLowerCase().includes('investment banking') || category === 'IB') normalizedCategory = 'Investment Banking';
          else if (category.toLowerCase().includes('private equity') || category === 'PE') normalizedCategory = 'Private Equity';
          else if (category.toLowerCase().includes('venture capital') || category === 'VC') normalizedCategory = 'Venture Capital';
          else if (category.toLowerCase().includes('product manage')) normalizedCategory = 'Product Management';
          else if (category.toLowerCase().includes('market')) normalizedCategory = 'Marketing';
          else if (category.toLowerCase().includes('general manage')) normalizedCategory = 'General Management';
          else if (category.toLowerCase().includes('finance') && !category.toLowerCase().includes('corporate')) normalizedCategory = 'Finance';
          else if (category.toLowerCase().includes('corporate finance')) normalizedCategory = 'Corporate Finance';
        } else {
          // Normalize industries
          if (category.toLowerCase().includes('consult')) normalizedCategory = 'Consulting';
          else if (category.toLowerCase().includes('financial services') || category.toLowerCase().includes('finance')) normalizedCategory = 'Financial Services';
          else if (category.toLowerCase().includes('technology') || category.toLowerCase().includes('tech')) normalizedCategory = 'Technology';
          else if (category.toLowerCase().includes('healthcare') || category.toLowerCase().includes('pharma')) normalizedCategory = 'Healthcare';
        }
        
        if (aggregated[normalizedCategory]) {
          aggregated[normalizedCategory] += pct;
        } else {
          aggregated[normalizedCategory] = pct;
        }
      }
    });

    return Object.entries(aggregated)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 categories
  };

  const getHistoricalTrendData = () => {
    const data = viewType === 'function' ? employmentData : industryData;
    const schoolData = data.filter(d => d.School === selectedSchool);
    
    // Get top 5 categories
    const categoryTotals = {};
    schoolData.forEach(d => {
      const category = viewType === 'function' ? d.Function : d.Industry;
      const pct = parseFloat(d.Percentage);
      if (!isNaN(pct)) {
        categoryTotals[category] = (categoryTotals[category] || 0) + pct;
      }
    });
    
    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);
    
    // Group by year
    const yearData = {};
    schoolData.forEach(d => {
      const category = viewType === 'function' ? d.Function : d.Industry;
      if (topCategories.includes(category)) {
        if (!yearData[d.Year]) {
          yearData[d.Year] = { year: d.Year };
        }
        yearData[d.Year][category] = parseFloat(d.Percentage);
      }
    });
    
    return Object.values(yearData).sort((a, b) => a.year - b.year);
  };

  const getTopCategories = () => {
    const filtered = getFilteredData();
    return filtered
      .map(d => ({
        name: viewType === 'function' ? d.Function : d.Industry,
        percentage: parseFloat(d.Percentage),
      }))
      .filter(d => !isNaN(d.percentage) && d.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10);
  };

  return (
    <Box>
      <Typography variant="h3" gutterBottom fontWeight="bold">
        💼 Employment Outcomes Analysis
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Explore historical employment trends by function and industry. See where graduates from each school
        are going and how placement patterns have evolved over time (2012-2025).
      </Typography>

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>School</InputLabel>
                <Select
                  value={selectedSchool}
                  onChange={(e) => {
                    setSelectedSchool(e.target.value);
                    setSelectedYear(''); // Reset year when school changes
                  }}
                  label="School"
                >
                  {schools.map(school => (
                    <MenuItem key={school} value={school}>{school}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  label="Year"
                  disabled={!selectedSchool}
                >
                  {years.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <ToggleButtonGroup
                value={viewType}
                exclusive
                onChange={(e, val) => val && setViewType(val)}
                fullWidth
              >
                <ToggleButton value="function">By Function</ToggleButton>
                <ToggleButton value="industry">By Industry</ToggleButton>
              </ToggleButtonGroup>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {selectedSchool && selectedYear && (
        <>
          {/* Charts */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Distribution by {viewType === 'function' ? 'Function' : 'Industry'} ({selectedYear})
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Normalized data showing top placement categories
                  </Typography>
                  {getPieChartData().length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={getPieChartData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({name, value}) => `${name}: ${value.toFixed(1)}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getPieChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 5 }}>
                      No data available for this selection
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Historical Trends for {selectedSchool}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Top 5 {viewType === 'function' ? 'functions' : 'industries'} over time
                  </Typography>
                  {getHistoricalTrendData().length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={getHistoricalTrendData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis label={{ value: 'Percentage', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value) => `${value?.toFixed(1)}%`} />
                        <Legend />
                        {getHistoricalTrendData().length > 0 && Object.keys(getHistoricalTrendData()[0])
                          .filter(key => key !== 'year')
                          .map((category, index) => (
                            <Line
                              key={category}
                              type="monotone"
                              dataKey={category}
                              stroke={COLORS[index % COLORS.length]}
                              strokeWidth={2}
                              dot={{ r: 4 }}
                            />
                          ))
                        }
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 5 }}>
                      No historical data available
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Detailed Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top {viewType === 'function' ? 'Functions' : 'Industries'} - {selectedSchool} ({selectedYear})
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Rank</strong></TableCell>
                      <TableCell><strong>{viewType === 'function' ? 'Function' : 'Industry'}</strong></TableCell>
                      <TableCell align="right"><strong>% of Graduates</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getTopCategories().map((row, index) => (
                      <TableRow key={`${row.name}-${index}`}>
                        <TableCell>
                          {index === 0 && '🥇 '}
                          {index === 1 && '🥈 '}
                          {index === 2 && '🥉 '}
                          {index > 2 && `${index + 1}.`}
                        </TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell align="right">
                          <strong>{row.percentage.toFixed(1)}%</strong>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {!selectedSchool && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Select a school to view employment data
          </Typography>
        </Paper>
      )}

      {/* Insights */}
      <Box sx={{ mt: 4, p: 3, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          💡 Understanding Employment Data
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" paragraph>
              <strong>Data Normalization:</strong> Similar categories have been consolidated (e.g., "Consulting" and 
              "Management Consulting") to provide clearer comparisons across schools and years.
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Historical Context:</strong> The trend charts show how employment patterns have evolved,
              helping you understand whether a school's strength in a particular area is growing or declining.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" paragraph>
              <strong>Top Functions:</strong> Consulting (30-40%), Finance (25-35%), and General Management (15-25%)
              consistently dominate placements across elite programs.
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Industry Trends:</strong> Technology placements have grown significantly since 2015, while
              traditional finance roles have remained stable but competitive.
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default Employment;
