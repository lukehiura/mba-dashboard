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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  ListItemText,
  OutlinedInput,
} from '@mui/material';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import Papa from 'papaparse';

const SCHOOL_COLORS = {
  'Stanford': '#8c1515',
  'Harvard': '#a51c30',
  'Wharton': '#011f5b',
  'Chicago Booth': '#800000',
  'MIT Sloan': '#a31f34',
};

function Comparison() {
  const [rankingsData, setRankingsData] = useState([]);
  const [selectedSchools, setSelectedSchools] = useState(['Stanford', 'Harvard', 'Wharton']);
  const [comparisonYear, setComparisonYear] = useState('2025');

  useEffect(() => {
    Papa.parse('/data/mba_rankings_1990_2025.csv', {
      download: true,
      header: true,
      complete: (results) => {
        setRankingsData(results.data);
      },
    });
  }, []);

  const allSchools = [...new Set(rankingsData.map(d => d.school))].sort();
  const years = [...new Set(rankingsData.map(d => d.year))].sort().reverse();

  const getSchoolData = (school) => {
    const data = rankingsData.find(d => d.school === school && d.year === comparisonYear);
    return data || {};
  };

  const getRadarData = () => {
    const metrics = [
      { metric: 'Ranking', key: 'rank', invert: true },
      { metric: 'GMAT', key: 'avg_gmat', invert: false },
      { metric: 'GPA', key: 'avg_gpa', invert: false },
      { metric: 'Employment', key: 'employment_rate', invert: false },
      { metric: 'Salary', key: 'median_salary', invert: false },
    ];

    return metrics.map(m => {
      const dataPoint = { metric: m.metric };
      selectedSchools.forEach(school => {
        const schoolData = getSchoolData(school);
        let value = parseFloat(schoolData[m.key]) || 0;
        
        // Normalize values to 0-100 scale
        if (m.key === 'rank') {
          value = m.invert ? (15 - value) / 15 * 100 : value;
        } else if (m.key === 'avg_gmat') {
          value = (value / 800) * 100;
        } else if (m.key === 'avg_gpa') {
          value = (value / 4.0) * 100;
        } else if (m.key === 'median_salary') {
          value = (value / 200000) * 100;
        }
        
        dataPoint[school] = Math.min(100, Math.max(0, value));
      });
      return dataPoint;
    });
  };

  const getSalaryComparisonData = () => {
    return selectedSchools.map(school => {
      const data = getSchoolData(school);
      return {
        school: school.substring(0, 15),
        salary: parseInt(data.median_salary) || 0,
      };
    });
  };

  const handleSchoolChange = (event) => {
    const value = event.target.value;
    setSelectedSchools(typeof value === 'string' ? value.split(',') : value);
  };

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    return `$${parseInt(value).toLocaleString()}`;
  };

  return (
    <Box>
      <Typography variant="h3" gutterBottom fontWeight="bold">
        ⚖️ School Comparison Tool
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Compare up to 5 MBA programs side-by-side across key metrics including rankings, admissions,
        employment, and compensation.
      </Typography>

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <FormControl fullWidth>
                <InputLabel>Select Schools to Compare</InputLabel>
                <Select
                  multiple
                  value={selectedSchools}
                  onChange={handleSchoolChange}
                  input={<OutlinedInput label="Select Schools to Compare" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {allSchools.map((school) => (
                    <MenuItem key={school} value={school}>
                      <Checkbox checked={selectedSchools.indexOf(school) > -1} />
                      <ListItemText primary={school} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Comparison Year</InputLabel>
                <Select
                  value={comparisonYear}
                  onChange={(e) => setComparisonYear(e.target.value)}
                  label="Comparison Year"
                >
                  {years.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Radar Chart */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Multi-Dimensional Comparison
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={getRadarData()}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  {selectedSchools.map((school, index) => (
                    <Radar
                      key={school}
                      name={school}
                      dataKey={school}
                      stroke={Object.values(SCHOOL_COLORS)[index % 5]}
                      fill={Object.values(SCHOOL_COLORS)[index % 5]}
                      fillOpacity={0.3}
                    />
                  ))}
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Median Salary Comparison ({comparisonYear})
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={getSalaryComparisonData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="school" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="salary" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Comparison Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Detailed Metrics Comparison
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Metric</strong></TableCell>
                  {selectedSchools.map(school => (
                    <TableCell key={school} align="center">
                      <strong>{school}</strong>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell><strong>Rank ({comparisonYear})</strong></TableCell>
                  {selectedSchools.map(school => (
                    <TableCell key={school} align="center">
                      <Chip label={`#${getSchoolData(school).rank || 'N/A'}`} color="primary" size="small" />
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell><strong>GMAT (80% range)</strong></TableCell>
                  {selectedSchools.map(school => {
                    const data = getSchoolData(school);
                    return (
                      <TableCell key={school} align="center">
                        {data.avg_gmat || 'N/A'}
                      </TableCell>
                    );
                  })}
                </TableRow>
                <TableRow>
                  <TableCell><strong>GPA</strong></TableCell>
                  {selectedSchools.map(school => {
                    const data = getSchoolData(school);
                    return (
                      <TableCell key={school} align="center">
                        {data.avg_gpa || 'N/A'}
                      </TableCell>
                    );
                  })}
                </TableRow>
                <TableRow>
                  <TableCell><strong>Acceptance Rate</strong></TableCell>
                  {selectedSchools.map(school => {
                    const data = getSchoolData(school);
                    return (
                      <TableCell key={school} align="center">
                        {data.acceptance_rate ? `${data.acceptance_rate}%` : 'N/A'}
                      </TableCell>
                    );
                  })}
                </TableRow>
                <TableRow>
                  <TableCell><strong>Employment Rate (3 mo)</strong></TableCell>
                  {selectedSchools.map(school => {
                    const data = getSchoolData(school);
                    return (
                      <TableCell key={school} align="center">
                        {data.employment_rate ? `${data.employment_rate}%` : 'N/A'}
                      </TableCell>
                    );
                  })}
                </TableRow>
                <TableRow>
                  <TableCell><strong>Median Salary</strong></TableCell>
                  {selectedSchools.map(school => {
                    const data = getSchoolData(school);
                    return (
                      <TableCell key={school} align="center">
                        {formatCurrency(data.median_salary)}
                      </TableCell>
                    );
                  })}
                </TableRow>
                <TableRow>
                  <TableCell><strong>Class Size</strong></TableCell>
                  {selectedSchools.map(school => {
                    const data = getSchoolData(school);
                    return (
                      <TableCell key={school} align="center">
                        {data.class_size || 'N/A'}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Insights */}
      <Box sx={{ mt: 4, p: 3, backgroundColor: '#f0f7ff', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          💡 How to Use This Comparison
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>Radar Chart:</strong> Shows a multi-dimensional view of how schools stack up across key metrics.
          Larger areas indicate stronger overall performance.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>Consider Fit:</strong> Beyond rankings and salaries, consider factors like culture, location,
          specializations, and career goals when choosing a program.
        </Typography>
        <Typography variant="body2">
          <strong>Long-term View:</strong> Check the "Rankings Evolution" page to see how schools have trended
          over time rather than focusing solely on a single year.
        </Typography>
      </Box>
    </Box>
  );
}

export default Comparison;

