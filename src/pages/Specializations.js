import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  BusinessCenter,
  AttachMoney,
  Laptop,
  Campaign,
  EmojiEvents,
  TrendingUp,
  School as SchoolIcon,
  Lightbulb,
} from '@mui/icons-material';
import Papa from 'papaparse';

function Specializations() {
  const [employmentData, setEmploymentData] = useState([]);

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
        },
      });
      Papa.parse(industryText, {
        header: true,
        complete: (results) => {
          // Industry data parsed but not currently used in this component
          // const cleaned = results.data.filter(row => row.School && row.Year && row.Industry && row.Percentage);
          // setIndustryData(cleaned);
        },
      });
    });
  }, []);

  const getSpecializationData = () => {
    // Get all available data (not just 2024-2025)
    const schoolAverages = {};
    
    // Normalize and aggregate function data
    employmentData.forEach(row => {
      const school = row.School;
      let func = row.Function;
      const pct = parseFloat(row.Percentage);
      
      if (!school || !func || isNaN(pct)) return;
      
      // Normalize function names
      if (func.toLowerCase().includes('consult')) func = 'Consulting';
      else if (func.toLowerCase().includes('investment banking') || func === 'IB') func = 'Investment Banking';
      else if (func.toLowerCase().includes('private equity') || func === 'PE') func = 'Private Equity';
      else if (func.toLowerCase().includes('venture capital') || func === 'VC') func = 'Venture Capital';
      else if (func.toLowerCase().includes('finance') && !func.toLowerCase().includes('corporate')) func = 'Finance';
      else if (func.toLowerCase().includes('corporate finance')) func = 'Corporate Finance';
      else if (func.toLowerCase().includes('product manage')) func = 'Product Management';
      else if (func.toLowerCase().includes('market')) func = 'Marketing';
      else if (func.toLowerCase().includes('general manage') || func.toLowerCase().includes('business ops')) func = 'General Management';
      else return; // Skip non-core functions
      
      if (!schoolAverages[school]) schoolAverages[school] = {};
      if (!schoolAverages[school][func]) schoolAverages[school][func] = { total: 0, count: 0 };
      
      schoolAverages[school][func].total += pct;
      schoolAverages[school][func].count += 1;
    });
    
    // Calculate averages
    const result = {};
    Object.keys(schoolAverages).forEach(school => {
      result[school] = {};
      Object.keys(schoolAverages[school]).forEach(func => {
        const data = schoolAverages[school][func];
        result[school][func] = {
          percent: data.total / data.count,
          count: data.count
        };
      });
    });
    
    return result;
  };

  // Unused function - commented out to fix ESLint warning
  // const getTopFunctionsForSchool = (school) => {
  //   const data = getSpecializationData()[school] || {};
  //   return Object.entries(data)
  //     .sort((a, b) => b[1].percent - a[1].percent)
  //     .slice(0, 5)
  //     .map(([func, stats]) => ({
  //       function: func,
  //       percent: stats.percent,
  //       dataPoints: stats.count,
  //     }));
  // };

  const getSchoolsByFunction = (targetFunction) => {
    const data = getSpecializationData();
    const schools = [];
    
    Object.entries(data).forEach(([school, functions]) => {
      // Look for exact or normalized match
      const matchingFunc = Object.keys(functions).find(f => 
        f === targetFunction || 
        f.toLowerCase().includes(targetFunction.toLowerCase()) ||
        targetFunction.toLowerCase().includes(f.toLowerCase())
      );
      
      if (matchingFunc) {
        schools.push({
          school,
          percent: functions[matchingFunc].percent,
          dataPoints: functions[matchingFunc].count,
        });
      }
    });
    
    return schools.sort((a, b) => b.percent - a.percent);
  };

  const specializations = {
    'Stanford': {
      primary: 'Entrepreneurship & Tech',
      strengths: ['Technology', 'Venture Capital', 'General Management', 'Entrepreneurship'],
      notable: 'Highest concentration of tech placements among M7 schools',
      stats: '35% → Technology, 31% → Finance, 12% → Consulting',
    },
    'Harvard': {
      primary: 'General Management & Consulting',
      strengths: ['Consulting', 'General Management', 'Finance', 'Leadership Development'],
      notable: 'Strongest general management preparation and CEO pipeline',
      stats: '30% → Consulting, 26% → Finance, 22% → General Management',
    },
    'Wharton': {
      primary: 'Finance & Investment',
      strengths: ['Investment Banking', 'Private Equity', 'Asset Management', 'Quantitative Finance'],
      notable: '#1 for finance placements and highest finance salaries',
      stats: '34% → Finance, 32% → Consulting, 17% → Marketing',
    },
    'Chicago Booth': {
      primary: 'Finance & Analytics',
      strengths: ['Investment Banking', 'Private Equity', 'Consulting', 'Data-Driven Strategy'],
      notable: 'Top choice for investment banking and quantitative roles',
      stats: '35.6% → Finance, 35.2% → Consulting, 7.3% → Tech Product',
    },
    'MIT Sloan': {
      primary: 'Technology & Innovation',
      strengths: ['Technology', 'Operations', 'Entrepreneurship', 'Data Science'],
      notable: 'Leading program for tech management and operations',
      stats: '31% → Finance, 27% → Consulting, 24% → Technology',
    },
    'Kellogg': {
      primary: 'Marketing & General Management',
      strengths: ['Marketing', 'Brand Management', 'Consulting', 'General Management'],
      notable: '#1 for marketing and consumer goods placements',
      stats: '36% → Consulting, 23% → Finance, 18% → Marketing',
    },
    'NYU Stern': {
      primary: 'Finance & Media',
      strengths: ['Investment Banking', 'Asset Management', 'Media', 'Real Estate'],
      notable: 'Unmatched access to NYC finance and media industries',
      stats: '36.6% → Financial Services, 32.8% → Consulting, 14.2% → Tech',
    },
  };

  const formatPercent = (value) => {
    if (!value && value !== 0) return 'N/A';
    return `${value.toFixed(1)}%`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <EmojiEvents sx={{ fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h3" fontWeight="bold">
          School Specializations
        </Typography>
      </Box>
      <Typography variant="body1" color="text.secondary" paragraph>
        Discover what each MBA program is known for. Identify schools that excel in specific industries
        and functions based on normalized placement data and historical trends.
      </Typography>

      {/* School Specialization Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Object.entries(specializations).map(([school, data]) => (
          <Grid item xs={12} md={6} lg={4} key={school}>
            <Card sx={{ height: '100%', borderLeft: '4px solid', borderColor: 'primary.main' }}>
              <CardContent>
                <Typography variant="h5" gutterBottom color="primary" fontWeight="bold">
                  {school}
                </Typography>
                <Chip 
                  label={data.primary} 
                  color="primary" 
                  sx={{ mb: 2 }} 
                />
                
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Key Strengths:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {data.strengths.map(strength => (
                    <Chip key={strength} label={strength} size="small" variant="outlined" />
                  ))}
                </Box>

                <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="caption" color="text.secondary">
                    <strong>Notable:</strong> {data.notable}
                  </Typography>
                </Paper>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {data.stats}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Function-Specific Rankings */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 4, mb: 3 }}>
        <TrendingUp sx={{ fontSize: 36, color: 'primary.main' }} />
        <Typography variant="h4" fontWeight="bold">
          Schools by Function Specialization
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BusinessCenter color="primary" />
                <Typography variant="h6">
                  Best for Consulting
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Average % over all available years
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>School</strong></TableCell>
                      <TableCell align="right"><strong>Avg % to Consulting</strong></TableCell>
                      <TableCell align="right"><strong>Data Points</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getSchoolsByFunction('Consulting').slice(0, 5).map((row, index) => (
                      <TableRow key={`consulting-${index}`}>
                        <TableCell>
                          {index === 0 && '🥇 '}
                          {index === 1 && '🥈 '}
                          {index === 2 && '🥉 '}
                          {row.school}
                        </TableCell>
                        <TableCell align="right">{formatPercent(row.percent)}</TableCell>
                        <TableCell align="right">{row.dataPoints} years</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AttachMoney color="success" />
                <Typography variant="h6">
                  Best for Finance
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Average % over all available years
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>School</strong></TableCell>
                      <TableCell align="right"><strong>Avg % to Finance</strong></TableCell>
                      <TableCell align="right"><strong>Data Points</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getSchoolsByFunction('Finance').slice(0, 5).map((row, index) => (
                      <TableRow key={`finance-${index}`}>
                        <TableCell>
                          {index === 0 && '🥇 '}
                          {index === 1 && '🥈 '}
                          {index === 2 && '🥉 '}
                          {row.school}
                        </TableCell>
                        <TableCell align="right">{formatPercent(row.percent)}</TableCell>
                        <TableCell align="right">{row.dataPoints} years</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Laptop color="info" />
                <Typography variant="h6">
                  Best for Tech/Product
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Based on available historical data
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>School</strong></TableCell>
                      <TableCell align="right"><strong>% to Tech</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { school: 'Stanford', percent: 42.0 },
                      { school: 'MIT Sloan', percent: 31.0 },
                      { school: 'Berkeley Haas', percent: 22.0 },
                      { school: 'Kellogg', percent: 21.3 },
                      { school: 'NYU Stern', percent: 14.2 },
                    ].map((row, index) => (
                      <TableRow key={`tech-${index}`}>
                        <TableCell>
                          {index === 0 && '🥇 '}
                          {index === 1 && '🥈 '}
                          {index === 2 && '🥉 '}
                          {row.school}
                        </TableCell>
                        <TableCell align="right">{row.percent}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Campaign color="warning" />
                <Typography variant="h6">
                  Best for Marketing
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Average % over all available years
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>School</strong></TableCell>
                      <TableCell align="right"><strong>Avg % to Marketing</strong></TableCell>
                      <TableCell align="right"><strong>Data Points</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getSchoolsByFunction('Marketing').slice(0, 5).map((row, index) => (
                      <TableRow key={`marketing-${index}`}>
                        <TableCell>
                          {index === 0 && '🥇 '}
                          {index === 1 && '🥈 '}
                          {index === 2 && '🥉 '}
                          {row.school}
                        </TableCell>
                        <TableCell align="right">{formatPercent(row.percent)}</TableCell>
                        <TableCell align="right">{row.dataPoints} years</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recommendations */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <SchoolIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight="bold">
            Choosing the Right Program for You
          </Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%', backgroundColor: '#e8f5e9' }}>
              <Typography variant="h6" color="success.main" gutterBottom>
                For Finance Careers
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Top Choices:</strong> Wharton, Chicago Booth, NYU Stern
              </Typography>
              <Typography variant="body2">
                These schools have the strongest finance networks, highest finance placement rates,
                and best access to investment banking and private equity roles.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%', backgroundColor: '#e3f2fd' }}>
              <Typography variant="h6" color="primary" gutterBottom>
                For Tech/Product
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Top Choices:</strong> Stanford, MIT Sloan, Berkeley Haas
              </Typography>
              <Typography variant="body2">
                Best for tech management, product roles, and entrepreneurship with strong
                Silicon Valley connections and tech-focused curriculum.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%', backgroundColor: '#fff3e0' }}>
              <Typography variant="h6" color="warning.main" gutterBottom>
                For Consulting
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Top Choices:</strong> Harvard, Kellogg, Chicago Booth
              </Typography>
              <Typography variant="body2">
                Strong consulting placement across all top firms, excellent case interview prep,
                and broad general management foundations.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%', backgroundColor: '#fce4ec' }}>
              <Typography variant="h6" color="secondary.main" gutterBottom>
                For Marketing
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Top Choices:</strong> Kellogg, Harvard, Stanford
              </Typography>
              <Typography variant="body2">
                Best programs for brand management, product marketing, and consumer goods with
                strong industry connections.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%', backgroundColor: '#f3e5f5' }}>
              <Typography variant="h6" sx={{ color: '#7b1fa2' }} gutterBottom>
                For Entrepreneurship
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Top Choices:</strong> Stanford, MIT Sloan, Harvard
              </Typography>
              <Typography variant="body2">
                Highest percentage of graduates starting businesses, best venture capital
                access, and strongest entrepreneurial ecosystems.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%', backgroundColor: '#e0f2f1' }}>
              <Typography variant="h6" sx={{ color: '#00695c' }} gutterBottom>
                For Flexibility
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Top Choices:</strong> Harvard, Stanford, Wharton
              </Typography>
              <Typography variant="body2">
                Most balanced programs with strong placement across all functions and industries,
                ideal if you're still exploring career paths.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Data Info */}
      <Box sx={{ mt: 4, p: 3, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Lightbulb color="primary" />
          <Typography variant="h6">
            Understanding Specialization Data
          </Typography>
        </Box>
        <Typography variant="body2" paragraph>
          <strong>Normalization:</strong> Similar function categories have been consolidated (e.g., "Consulting", 
          "Management Consulting") to provide accurate comparisons. Percentages represent averages across all 
          available years of data.
        </Typography>
        <Typography variant="body2">
          <strong>Data Points:</strong> The number of years of data varies by school. More data points generally 
          indicate more reliable averages. Use this information to assess the consistency of each school's 
          specialization strength.
        </Typography>
      </Box>
    </Box>
  );
}

export default Specializations;
