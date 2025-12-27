import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Paper,
} from '@mui/material';
import {
  TrendingUp,
  School,
  AttachMoney,
  BusinessCenter,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Papa from 'papaparse';

function Dashboard() {
  const [rankingsData, setRankingsData] = useState([]);
  const [employmentData, setEmploymentData] = useState([]);
  const [specializationData, setSpecializationData] = useState([]);
  const [stats] = useState({
    totalSchools: 15,
    yearsTracked: 41,
    dataPointsRankings: '580+',
    employmentYears: '2012-2025',
  });

  useEffect(() => {
    // Load rankings data
    Papa.parse('/data/mba_rankings_1984_2025.csv', {
      download: true,
      header: true,
      complete: (results) => {
        const cleaned = results.data.filter(row => row.School && row.Year && row.Rank);
        setRankingsData(cleaned);
      },
    });

    // Load employment data
    Papa.parse('/data/employment_by_function.csv', {
      download: true,
      header: true,
      complete: (results) => {
        const cleaned = results.data.filter(row => row.School && row.Year && row.Function && row.Percentage);
        setEmploymentData(cleaned);
      },
    });

    // Load specialization data
    Papa.parse('/data/school_specializations.csv', {
      download: true,
      header: true,
      complete: (results) => {
        const cleaned = results.data.filter(row => row.School && row.Function && row.Avg_Percentage);
        setSpecializationData(cleaned);
      },
    });
  }, []);

  const getHistoricalRankings = () => {
    const schools = ['Stanford', 'Harvard', 'Wharton', 'MIT Sloan', 'Chicago Booth'];
    return schools.map(schoolName => {
      const schoolData = rankingsData.filter(d => d.School === schoolName);
      if (schoolData.length === 0) return null;
      
      const avgRank = (schoolData.reduce((acc, d) => acc + parseInt(d.Rank), 0) / schoolData.length).toFixed(2);
      const timesFirst = schoolData.filter(d => parseInt(d.Rank) === 1).length;
      const years = schoolData.length;
      
      return { school: schoolName, avgRank, timesFirst, years };
    }).filter(Boolean);
  };

  const getTopFunctionsOverall = () => {
    // Normalize and aggregate all employment data
    const functionTotals = {};
    const functionCounts = {};
    const topSchools = {};

    employmentData.forEach(row => {
      let func = row.Function;
      const pct = parseFloat(row.Percentage);
      const school = row.School;
      
      if (isNaN(pct)) return;
      
      // Normalize function names
      if (func.toLowerCase().includes('consult')) func = 'Consulting';
      else if (func.toLowerCase().includes('finance') || func.toLowerCase().includes('investment banking')) func = 'Finance';
      else if (func.toLowerCase().includes('technology') || func.toLowerCase().includes('tech')) func = 'Technology';
      else if (func.toLowerCase().includes('general manage') || func.toLowerCase().includes('business ops')) func = 'General Management';
      else if (func.toLowerCase().includes('market')) func = 'Marketing';
      else return; // Skip other functions
      
      if (!functionTotals[func]) {
        functionTotals[func] = 0;
        functionCounts[func] = 0;
        topSchools[func] = {};
      }
      
      functionTotals[func] += pct;
      functionCounts[func] += 1;
      
      if (!topSchools[func][school]) topSchools[func][school] = 0;
      topSchools[func][school] += pct;
    });

    return Object.keys(functionTotals).map(func => {
      const avg = functionTotals[func] / functionCounts[func];
      // Get top 3 schools for this function
      const schoolList = Object.entries(topSchools[func])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([school]) => school)
        .join(', ');
      
      return {
        function: func,
        avgPct: avg.toFixed(1),
        topSchools: schoolList,
      };
    }).sort((a, b) => parseFloat(b.avgPct) - parseFloat(a.avgPct));
  };

  const getSchoolSpecializations = () => {
    // Get top specialization for each school
    const schools = ['Kellogg', 'Chicago Booth', 'Stanford', 'Columbia', 'MIT Sloan', 'Harvard'];
    
    return schools.map(school => {
      const schoolSpec = specializationData.filter(d => d.School === school);
      if (schoolSpec.length === 0) return null;
      
      // Sort by average percentage and get top 2
      const sorted = schoolSpec
        .map(s => ({
          function: s.Function,
          pct: parseFloat(s.Avg_Percentage),
        }))
        .filter(s => !isNaN(s.pct))
        .sort((a, b) => b.pct - a.pct);
      
      if (sorted.length === 0) return null;
      
      const top1 = sorted[0];
      const top2 = sorted.length > 1 ? sorted[1] : null;
      
      // Determine specialty based on top functions
      let specialty = top1.function;
      if (top1.function.toLowerCase().includes('consult')) specialty = 'Consulting & Strategy';
      else if (top1.function.toLowerCase().includes('finance')) specialty = 'Finance & Banking';
      else if (top1.function.toLowerCase().includes('tech')) specialty = 'Tech & Innovation';
      else if (top1.function.toLowerCase().includes('market')) specialty = 'Marketing & Brand';
      
      const strengthText = top2 
        ? `${top1.pct.toFixed(1)}% → ${top1.function}, ${top2.pct.toFixed(1)}% → ${top2.function}`
        : `${top1.pct.toFixed(1)}% → ${top1.function}`;
      
      return {
        school,
        specialty,
        strengthText,
      };
    }).filter(Boolean);
  };

  const getRankingTrendData = () => {
    // Get ranking trends for top schools over time
    const schools = ['Stanford', 'Harvard', 'Wharton', 'MIT Sloan', 'Chicago Booth'];
    const yearData = {};
    
    rankingsData.forEach(row => {
      const year = parseInt(row.Year);
      const school = row.School;
      const rank = parseInt(row.Rank);
      
      if (schools.includes(school) && year >= 1990) {
        if (!yearData[year]) yearData[year] = { year };
        yearData[year][school] = rank;
      }
    });
    
    return Object.values(yearData).sort((a, b) => a.year - b.year);
  };

  const getEmploymentTrendData = () => {
    // Get employment trends by function over time
    const functionTotals = {};
    
    employmentData.forEach(row => {
      let func = row.Function;
      const pct = parseFloat(row.Percentage);
      const year = parseInt(row.Year);
      
      if (isNaN(pct) || isNaN(year) || year < 2015) return;
      
      // Normalize function names
      if (func.toLowerCase().includes('consult')) func = 'Consulting';
      else if (func.toLowerCase().includes('finance') || func.toLowerCase().includes('investment banking')) func = 'Finance';
      else if (func.toLowerCase().includes('technology') || func.toLowerCase().includes('tech')) func = 'Technology';
      else if (func.toLowerCase().includes('general manage') || func.toLowerCase().includes('business ops')) func = 'General Management';
      else if (func.toLowerCase().includes('market')) func = 'Marketing';
      else return;
      
      if (!functionTotals[year]) functionTotals[year] = { year };
      if (!functionTotals[year][func]) functionTotals[year][func] = { total: 0, count: 0 };
      
      functionTotals[year][func].total += pct;
      functionTotals[year][func].count += 1;
    });
    
    // Calculate averages
    const result = Object.keys(functionTotals).map(year => {
      const yearData = { year: parseInt(year) };
      Object.keys(functionTotals[year]).forEach(func => {
        if (func !== 'year' && functionTotals[year][func].count > 0) {
          yearData[func] = (functionTotals[year][func].total / functionTotals[year][func].count);
        }
      });
      return yearData;
    }).sort((a, b) => a.year - b.year);
    
    return result;
  };

  const SCHOOL_COLORS = {
    'Stanford': '#DC143C',
    'Harvard': '#A51C30',
    'Wharton': '#004785',
    'MIT Sloan': '#FF6B35',
    'Chicago Booth': '#800000',
  };

  const FUNCTION_COLORS = {
    'Consulting': '#0088FE',
    'Finance': '#00C49F',
    'Technology': '#FFBB28',
    'General Management': '#FF8042',
    'Marketing': '#8884D8',
  };

  const StatCard = ({ icon, title, value, subtitle, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              backgroundColor: `${color}20`,
              borderRadius: '50%',
              p: 1,
              mr: 2,
            }}
          >
            {React.cloneElement(icon, { sx: { color, fontSize: 32 } })}
          </Box>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const historicalRankings = getHistoricalRankings();
  const topFunctions = getTopFunctionsOverall();
  const schoolSpecs = getSchoolSpecializations();
  const rankingTrends = getRankingTrendData();
  const employmentTrends = getEmploymentTrendData();

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom fontWeight="bold">
          MBA Historical Analysis Dashboard (1984-2025)
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Explore 41 years of MBA program data: employment trends since 2012, salary growth over decades, 
          and detailed school specializations. Rankings shown are <strong>overall university rankings</strong> for 
          institutional context. Visit the <strong>Rankings page</strong> for detailed MBA program-specific analysis.
        </Typography>
      </Box>

      {/* Key Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<School />}
            title="MBA Programs Tracked"
            value={stats.totalSchools}
            subtitle="Top business schools including all M7 programs"
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<TrendingUp />}
            title="Years of Rankings"
            value={stats.yearsTracked}
            subtitle="1984 to 2025 (most comprehensive dataset)"
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<BusinessCenter />}
            title="Employment Data"
            value={stats.employmentYears}
            subtitle="Function & industry placement trends"
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<AttachMoney />}
            title="Data Points"
            value={stats.dataPointsRankings}
            subtitle="Ranking observations across all schools"
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Key Insights */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                🏆 Historical Average Rankings (1984-2025)
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Based on U.S. News <strong>University Rankings</strong> (not MBA-specific program rankings)
              </Typography>
              <Box sx={{ mt: 2 }}>
                {historicalRankings.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1.5,
                      borderBottom: index < historicalRankings.length - 1 ? '1px solid #eee' : 'none',
                    }}
                  >
                    <Box>
                      <Typography variant="body1" fontWeight="500">{item.school}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.years} years • {item.timesFirst}x #1
                      </Typography>
                    </Box>
                    <Chip label={`Avg: ${item.avgRank}`} color="primary" size="small" />
                  </Box>
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', fontStyle: 'italic' }}>
                Note: These are overall university rankings. MBA program rankings may differ.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                📊 Historical Trends & Insights
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Paper elevation={0} sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    🎯 Ranking Context
                  </Typography>
                  <Typography variant="body2">
                    These rankings reflect <strong>overall university prestige</strong> over 41 years.
                    While correlated with MBA program quality, business school rankings follow different patterns.
                    See the <strong>Rankings page</strong> for detailed MBA program analysis.
                  </Typography>
                </Paper>

                <Paper elevation={0} sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="subtitle2" color="success.main" gutterBottom>
                    📈 Key Observations
                  </Typography>
                  <Typography variant="body2">
                    <strong>Harvard</strong> leads in overall university rankings with the most #1 positions.
                    <strong> Stanford</strong> and <strong>MIT</strong> show strong, consistent performance.
                    University rankings provide context for institutional resources and reputation.
                  </Typography>
                </Paper>

                <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="subtitle2" color="secondary.main" gutterBottom>
                    ⏳ Historical Evolution
                  </Typography>
                  <Typography variant="body2">
                    The competitive landscape has intensified post-2010 with narrower gaps between top institutions.
                    All top schools have maintained strong positions, reflecting sustained excellence in research and teaching.
                  </Typography>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Trend Visualizations */}
      <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mt: 4, mb: 3 }}>
        📈 Historical Trends & Evolution
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                University Rankings Evolution (1990-2025)
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Overall university rankings over time (institutional context, not MBA-specific)
              </Typography>
              {rankingTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={rankingTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="year" 
                      label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      reversed 
                      domain={[1, 15]} 
                      label={{ value: 'Ranking', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value) => `#${value}`}
                      labelFormatter={(label) => `Year: ${label}`}
                    />
                    <Legend />
                    {Object.keys(SCHOOL_COLORS).map(school => (
                      <Line
                        key={school}
                        type="monotone"
                        dataKey={school}
                        stroke={SCHOOL_COLORS[school]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                        name={school}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Typography color="text.secondary">Loading ranking trends...</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Employment Functions Over Time (2015-2025)
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Average placement % across all schools by function
              </Typography>
              {employmentTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={employmentTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="year"
                      label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Average %', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value) => `${value?.toFixed(1)}%`}
                      labelFormatter={(label) => `Year: ${label}`}
                    />
                    <Legend />
                    {Object.keys(FUNCTION_COLORS).map(func => (
                      <Area
                        key={func}
                        type="monotone"
                        dataKey={func}
                        stackId="1"
                        stroke={FUNCTION_COLORS[func]}
                        fill={FUNCTION_COLORS[func]}
                        fillOpacity={0.6}
                        name={func}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Typography color="text.secondary">Loading employment trends...</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Insights from Trends */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', backgroundColor: '#e8f5e9' }}>
            <Typography variant="h6" color="success.main" gutterBottom>
              📊 University Rankings
            </Typography>
            <Typography variant="body2">
              The rankings shown are <strong>overall university rankings</strong>, not MBA-specific. 
              They provide context for institutional resources and reputation but may differ from business school rankings.
              Check the Rankings page for MBA-focused data.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', backgroundColor: '#e3f2fd' }}>
            <Typography variant="h6" color="primary" gutterBottom>
              💼 Employment Shifts
            </Typography>
            <Typography variant="body2">
              <strong>Consulting</strong> has remained the dominant function (30-40%).
              <strong> Technology</strong> placements have grown significantly since 2015, reflecting industry demand.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', backgroundColor: '#fff3e0' }}>
            <Typography variant="h6" color="warning.main" gutterBottom>
              🎯 Strategic Takeaway
            </Typography>
            <Typography variant="body2">
              Rankings volatility has increased post-2020, showing fiercer competition. 
              Function preferences remain stable, making historical data reliable for decision-making.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Top Industries & Functions */}
      <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mt: 4, mb: 3 }}>
        🎯 Current Landscape
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                💼 Top Career Functions (2015-2025)
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Based on normalized historical data from all schools
              </Typography>
              <Box sx={{ mt: 2 }}>
                {topFunctions.map((item, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight="500">
                        {item.function}
                      </Typography>
                      <Typography variant="body2" color="primary" fontWeight="bold">
                        {item.avgPct}% avg
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Top schools: {item.topSchools}
                    </Typography>
                    <Box
                      sx={{
                        mt: 0.5,
                        height: 6,
                        backgroundColor: '#e0e0e0',
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          width: `${Math.min(parseFloat(item.avgPct) * 2.5, 100)}%`,
                          height: '100%',
                          backgroundColor: '#1976d2',
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                🎯 School Specializations
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Top 2 functions by average placement % (historical data)
              </Typography>
              <Box sx={{ mt: 2 }}>
                {schoolSpecs.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 2,
                      p: 2,
                      backgroundColor: '#f5f5f5',
                      borderRadius: 1,
                      borderLeft: '3px solid',
                      borderColor: 'primary.main',
                    }}
                  >
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {item.school}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {item.specialty}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.strengthText}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, p: 3, backgroundColor: '#e3f2fd', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          💡 About This Dashboard
        </Typography>
        <Typography variant="body2" paragraph>
          This interactive dashboard provides the most comprehensive historical analysis of top MBA programs available, 
          with employment statistics from 2012-2025 compiled from official school reports.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>Important Note on Rankings:</strong> The rankings displayed on this home page are <strong>overall 
          U.S. News University Rankings</strong>, which measure institutional prestige across all programs. These differ 
          from <strong>MBA Business School Rankings</strong>, which specifically evaluate business programs. 
        </Typography>
        <Typography variant="body2">
          For MBA-specific ranking analysis and historical trends, please visit the <strong>Rankings page</strong> 
          which contains dedicated business school ranking data and insights. All employment percentages are calculated 
          from actual data and normalized to ensure fair comparisons.
        </Typography>
      </Box>
    </Box>
  );
}

export default Dashboard;
