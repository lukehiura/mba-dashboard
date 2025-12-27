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
  Chip,
  Grid,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Papa from 'papaparse';

// Distinct, vibrant colors for each school - optimized for visibility and differentiation
const SCHOOL_COLORS = {
  'Stanford': '#DC143C',        // Crimson Red - Stanford's official color
  'Harvard': '#A51C30',         // Harvard Crimson
  'Wharton': '#004785',         // Penn Blue (darker, more vibrant)
  'Chicago Booth': '#800000',   // Maroon
  'MIT Sloan': '#FF6B35',       // Bright Orange-Red (distinct from Stanford)
  'Kellogg': '#4E2A84',         // Purple
  'Columbia': '#0077C8',        // Columbia Blue (vibrant, not light)
  'Berkeley Haas': '#FDB515',   // California Gold (very distinct)
  'Michigan Ross': '#FFCB05',   // Maize Yellow
  'Dartmouth Tuck': '#00693E',  // Dartmouth Green
  'Yale': '#00356B',            // Yale Blue
  'NYU Stern': '#57068C',       // NYU Violet
  'Duke Fuqua': '#001A57',      // Duke Blue
  'Darden': '#E57200',          // Virginia Orange
  'Cornell': '#B31B1B',         // Cornell Red
};

function Rankings() {
  const [rankingsData, setRankingsData] = useState([]);
  const [poetsQuantsData, setPoetsQuantsData] = useState([]);
  const [usNewsData, setUsNewsData] = useState([]);
  const [selectedSchools, setSelectedSchools] = useState([
    'Stanford',
    'Harvard',
    'Wharton',
    'Chicago Booth',
    'MIT Sloan',
  ]);
  const [timePeriod, setTimePeriod] = useState('all');
  const [chartData, setChartData] = useState([]);
  const [selectedPQYear, setSelectedPQYear] = useState('2025');
  const [viewType, setViewType] = useState('single'); // 'single', 'all', or 'decade'

  useEffect(() => {
    // Load the MBA Business School Rankings 2001-2025
    Papa.parse('/data/mba_business_school_rankings_2001_2025.csv', {
      download: true,
      header: true,
      complete: (results) => {
        // Filter out empty rows
        const cleanedData = results.data.filter(row => row.School && row.Year && row.Rank);
        setRankingsData(cleanedData);
        processChartData(cleanedData, selectedSchools, timePeriod);
      },
    });
    
    // Load official U.S. News MBA rankings
    Papa.parse('/data/mba_business_school_rankings_2001_2025.csv', {
      download: true,
      header: true,
      complete: (results) => {
        const cleanedData = results.data.filter(row => row.School && row.Year && row.Rank);
        setUsNewsData(cleanedData);
      },
    });
    
    // Load Poets & Quants composite rankings
    Papa.parse('/data/poets_quants_rankings.csv', {
      download: true,
      header: true,
      complete: (results) => {
        const cleanedData = results.data.filter(row => row.School && row.Year && row.Rank);
        setPoetsQuantsData(cleanedData);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (rankingsData.length > 0) {
      processChartData(rankingsData, selectedSchools, timePeriod);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSchools, timePeriod, rankingsData]);

  const processChartData = (data, schools, period) => {
    // Filter by time period
    let filteredData = data;
    if (period === '2020-2025') {
      filteredData = data.filter(d => parseInt(d.Year) >= 2020);
    } else if (period === '2010-2019') {
      filteredData = data.filter(d => parseInt(d.Year) >= 2010 && parseInt(d.Year) < 2020);
    } else if (period === '2000-2009') {
      filteredData = data.filter(d => parseInt(d.Year) >= 2000 && parseInt(d.Year) < 2010);
    } else if (period === '1990-1999') {
      filteredData = data.filter(d => parseInt(d.Year) >= 1990 && parseInt(d.Year) < 2000);
    } else if (period === '1984-1989') {
      filteredData = data.filter(d => parseInt(d.Year) < 1990);
    }

    // Group by year
    const groupedByYear = {};
    filteredData.forEach(row => {
      const year = row.Year;
      if (!groupedByYear[year]) {
        groupedByYear[year] = { year };
      }
      if (schools.includes(row.School)) {
        groupedByYear[year][row.School] = parseInt(row.Rank);
      }
    });

    const processed = Object.values(groupedByYear).sort((a, b) => parseInt(a.year) - parseInt(b.year));
    
    // Calculate trend lines for each school
    schools.forEach(school => {
      const schoolTrend = calculateTrendLine(processed, school);
      processed.forEach((yearData, idx) => {
        if (schoolTrend[idx] !== undefined) {
          yearData[`${school}_trend`] = schoolTrend[idx];
        }
      });
    });
    
    setChartData(processed);
  };

  // Linear regression to calculate trend line
  const calculateTrendLine = (data, school) => {
    const points = data
      .map((d, idx) => ({ x: idx, y: d[school] }))
      .filter(p => p.y !== undefined);
    
    if (points.length < 2) return [];
    
    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return data.map((_, idx) => {
      if (data[idx][school] !== undefined) {
        return slope * idx + intercept;
      }
      return undefined;
    });
  };

  const handleSchoolToggle = (school) => {
    if (selectedSchools.includes(school)) {
      setSelectedSchools(selectedSchools.filter(s => s !== school));
    } else {
      setSelectedSchools([...selectedSchools, school]);
    }
  };

  const handleTimePeriodChange = (event, newPeriod) => {
    if (newPeriod !== null) {
      setTimePeriod(newPeriod);
    }
  };

  const calculateAverageRank = (school) => {
    const schoolData = rankingsData.filter(d => d.School === school);
    if (schoolData.length === 0) return 'N/A';
    const sum = schoolData.reduce((acc, d) => acc + parseInt(d.Rank), 0);
    return (sum / schoolData.length).toFixed(2);
  };

  const getTimesRankedFirst = (school) => {
    return rankingsData.filter(d => d.School === school && parseInt(d.Rank) === 1).length;
  };

  const getBestRank = (school) => {
    const schoolData = rankingsData.filter(d => d.School === school);
    if (schoolData.length === 0) return 'N/A';
    return Math.min(...schoolData.map(d => parseInt(d.Rank)));
  };

  const getWorstRank = (school) => {
    const schoolData = rankingsData.filter(d => d.School === school);
    if (schoolData.length === 0) return 'N/A';
    return Math.max(...schoolData.map(d => parseInt(d.Rank)));
  };

  const getCurrentRank = (school) => {
    const current = rankingsData.find(d => d.School === school && d.Year === '2025');
    return current ? parseInt(current.Rank) : 'N/A';
  };

  // Calculate trend direction and slope
  const getTrendInfo = (school) => {
    const schoolData = rankingsData
      .filter(d => d.School === school)
      .map((d, idx) => ({ x: idx, y: parseInt(d.Rank), year: d.Year }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));
    
    if (schoolData.length < 2) return { direction: 'flat', slope: 0, change: 0 };
    
    const n = schoolData.length;
    const sumX = schoolData.reduce((sum, p) => sum + p.x, 0);
    const sumY = schoolData.reduce((sum, p) => sum + p.y, 0);
    const sumXY = schoolData.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumX2 = schoolData.reduce((sum, p) => sum + p.x * p.x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    // Calculate actual change from first to last year
    const firstRank = schoolData[0].y;
    const lastRank = schoolData[schoolData.length - 1].y;
    const change = lastRank - firstRank;
    
    // Negative slope means improving (lower rank numbers)
    // Positive slope means declining (higher rank numbers)
    let direction = 'flat';
    if (Math.abs(slope) < 0.05) {
      direction = 'flat';
    } else if (slope < 0) {
      direction = 'improving'; // Getting better (lower numbers)
    } else {
      direction = 'declining'; // Getting worse (higher numbers)
    }
    
    return { direction, slope, change };
  };

  const getTrendIcon = (direction) => {
    if (direction === 'improving') {
      return <TrendingDown sx={{ color: 'success.main', fontSize: 20 }} />;
    } else if (direction === 'declining') {
      return <TrendingUp sx={{ color: 'error.main', fontSize: 20 }} />;
    } else {
      return <TrendingFlat sx={{ color: 'text.secondary', fontSize: 20 }} />;
    }
  };

  const getTrendLabel = (trendInfo) => {
    if (trendInfo.direction === 'improving') {
      return `Improving (${Math.abs(trendInfo.change).toFixed(1)} ranks better)`;
    } else if (trendInfo.direction === 'declining') {
      return `Declining (${Math.abs(trendInfo.change).toFixed(1)} ranks worse)`;
    } else {
      return 'Stable';
    }
  };


  // Calculate average rank across available component rankings
  // Merge official U.S. News data with P&Q data
  const calculateAverageComponentRank = (school) => {
    // Get official U.S. News ranking if available
    const usNewsRanking = usNewsData.find(
      d => d.School === school.School && d.Year === school.Year
    );
    
    const ranks = [
      usNewsRanking ? usNewsRanking.Rank : school.US_News, // Prioritize official U.S. News
      school.Financial_Times,
      school.BusinessWeek,
      school.Forbes,
      school.LinkedIn,
      school.Princeton_Review,
      school.Economist
    ]
      .filter(r => r && r.toString().trim() !== '')
      .map(r => parseInt(r));
    
    if (ranks.length === 0) return null;
    
    const avg = ranks.reduce((sum, r) => sum + r, 0) / ranks.length;
    return { average: avg, count: ranks.length };
  };

  // Calculate historical average across all years for a school
  const calculateHistoricalAverages = (schoolName, yearRange = null) => {
    let schoolData = poetsQuantsData.filter(d => d.School === schoolName);
    
    // Filter by year range if specified (for decade view)
    if (yearRange) {
      const [startYear, endYear] = yearRange;
      schoolData = schoolData.filter(d => {
        const year = parseInt(d.Year);
        return year >= startYear && year <= endYear;
      });
    }
    
    if (schoolData.length === 0) return null;
    
    const components = {
      US_News: [],
      Financial_Times: [],
      BusinessWeek: [],
      Forbes: [],
      LinkedIn: [],
      Princeton_Review: [],
      Economist: []
    };
    
    // Collect all rankings for each component
    schoolData.forEach(data => {
      // Get official U.S. News ranking if available
      const usNewsRanking = usNewsData.find(
        d => d.School === schoolName && d.Year === data.Year
      );
      
      if (usNewsRanking && usNewsRanking.Rank) {
        components.US_News.push(parseInt(usNewsRanking.Rank));
      } else if (data.US_News && data.US_News.trim() !== '') {
        components.US_News.push(parseInt(data.US_News));
      }
      
      if (data.Financial_Times && data.Financial_Times.trim() !== '') components.Financial_Times.push(parseInt(data.Financial_Times));
      if (data.BusinessWeek && data.BusinessWeek.trim() !== '') components.BusinessWeek.push(parseInt(data.BusinessWeek));
      if (data.Forbes && data.Forbes.trim() !== '') components.Forbes.push(parseInt(data.Forbes));
      if (data.LinkedIn && data.LinkedIn.trim() !== '') components.LinkedIn.push(parseInt(data.LinkedIn));
      if (data.Princeton_Review && data.Princeton_Review.trim() !== '') components.Princeton_Review.push(parseInt(data.Princeton_Review));
      if (data.Economist && data.Economist.trim() !== '') components.Economist.push(parseInt(data.Economist));
    });
    
    // Calculate averages for each component
    const componentAverages = {};
    let totalSum = 0;
    let totalCount = 0;
    
    Object.keys(components).forEach(key => {
      if (components[key].length > 0) {
        const avg = components[key].reduce((sum, r) => sum + r, 0) / components[key].length;
        componentAverages[key] = {
          average: avg,
          count: components[key].length,
          years: schoolData.length
        };
        totalSum += avg;
        totalCount++;
      }
    });
    
    if (totalCount === 0) return null;
    
    return {
      overallAverage: totalSum / totalCount,
      componentAverages,
      totalSources: totalCount,
      yearsOfData: schoolData.length
    };
  };

  const availablePQYears = [...new Set(poetsQuantsData.map(d => d.Year))].sort().reverse();

  const allSchools = [...new Set(rankingsData.map(d => d.School))].sort();

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom fontWeight="bold">
          📈 MBA Business School Rankings Evolution (2001-2025)
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Track how top MBA <strong>business school programs</strong> have evolved over 25 years of 
          <strong> U.S. News MBA Rankings</strong> data. Identify the most consistent performers, dramatic risers, 
          and understand long-term competitive dynamics among the nation's elite MBA programs.
        </Typography>
        <Paper sx={{ p: 2, backgroundColor: '#e3f2fd', borderRadius: 2 }}>
          <Typography variant="body2" fontWeight="bold" color="primary" gutterBottom>
            📚 Important: MBA Program Rankings (Not University Rankings)
          </Typography>
          <Typography variant="body2">
            These rankings are <strong>U.S. News Business School Rankings</strong>, which specifically evaluate 
            MBA programs based on peer assessment (25%), recruiter surveys (15%), employment outcomes (21%), 
            GMAT scores and GPAs (24%), acceptance rates (1.25%), and starting salaries + bonuses (14%). 
            These differ from general university rankings shown on the Dashboard home page.
          </Typography>
        </Paper>
      </Box>

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="subtitle2" gutterBottom>
                Select Schools to Compare
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {allSchools.map(school => (
                  <Chip
                    key={school}
                    label={school}
                    onClick={() => handleSchoolToggle(school)}
                    color={selectedSchools.includes(school) ? 'primary' : 'default'}
                    variant={selectedSchools.includes(school) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>
                Time Period
              </Typography>
              <ToggleButtonGroup
                value={timePeriod}
                exclusive
                onChange={handleTimePeriodChange}
                aria-label="time period"
                size="small"
                fullWidth
              >
                <ToggleButton value="all">All (2001-2025)</ToggleButton>
                <ToggleButton value="2020-2025">2020-25</ToggleButton>
                <ToggleButton value="2010-2019">2010-19</ToggleButton>
                <ToggleButton value="2000-2009">2000-09</ToggleButton>
              </ToggleButtonGroup>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Rankings Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            MBA Program Ranking Trends (2001-2025)
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>U.S. News MBA Business School Rankings</strong> over 25 years. 
            Lower rank number = better (e.g., #1 is best). Solid lines show actual rankings, 
            dashed lines show trend direction (improving ↓ or declining ↑).
          </Typography>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="year" 
                label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                reversed 
                domain={[1, 20]} 
                label={{ value: 'Ranking', angle: -90, position: 'insideLeft' }} 
              />
              <Tooltip />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {selectedSchools.map(school => (
                <React.Fragment key={school}>
                  {/* Actual ranking line */}
                  <Line
                    type="monotone"
                    dataKey={school}
                    stroke={SCHOOL_COLORS[school] || '#000000'}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                    name={school}
                  />
                  {/* Trend line (dashed) */}
                  <Line
                    type="monotone"
                    dataKey={`${school}_trend`}
                    stroke={SCHOOL_COLORS[school] || '#000000'}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    connectNulls
                    name={`${school} trend`}
                    opacity={0.5}
                  />
                </React.Fragment>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* School Statistics */}
      <Grid container spacing={3}>
        {selectedSchools.map(school => {
          const trendInfo = getTrendInfo(school);
          return (
            <Grid item xs={12} sm={6} md={4} key={school}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" color="primary">
                      {school}
                    </Typography>
                    {getTrendIcon(trendInfo.direction)}
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Avg Rank (U.S. News Only):
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        #{calculateAverageRank(school)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Avg Rank (Composite*):
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {(() => {
                          // Calculate composite average from P&Q data (multiple sources)
                          const compositeData = poetsQuantsData.filter(d => d.School === school);
                          if (compositeData.length === 0) return 'N/A';
                          
                          const allAverages = compositeData
                            .map(d => calculateAverageComponentRank(d))
                            .filter(avg => avg !== null);
                          
                          if (allAverages.length === 0) return 'N/A';
                          
                          const overallAvg = allAverages.reduce((sum, avg) => sum + avg.average, 0) / allAverages.length;
                          return `#${overallAvg.toFixed(2)}`;
                        })()}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1, display: 'block' }}>
                      *Composite = Average across U.S. News + FT + BW + Forbes + LinkedIn + PR + Economist
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Times Ranked #1:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {getTimesRankedFirst(school)} times
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Best/Worst Rank:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        #{getBestRank(school)} / #{getWorstRank(school)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Current Rank (2025):
                      </Typography>
                      <Chip
                        label={`#${getCurrentRank(school)}`}
                        size="small"
                        color="primary"
                      />
                    </Box>
                    <Box sx={{ 
                      mt: 2, 
                      pt: 2, 
                      borderTop: '1px solid #eee',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        25-Year Trend:
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {getTrendIcon(trendInfo.direction)}
                        <Typography 
                          variant="caption" 
                          fontWeight="bold"
                          color={
                            trendInfo.direction === 'improving' ? 'success.main' :
                            trendInfo.direction === 'declining' ? 'error.main' :
                            'text.secondary'
                          }
                        >
                          {getTrendLabel(trendInfo)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Key Insights */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          📊 Key Insights from 25 Years of MBA Rankings (2001-2025)
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, backgroundColor: '#e8f5e9' }}>
              <Typography variant="h6" color="success.main" gutterBottom>
                🏆 The Big Three: Harvard, Stanford & Wharton
              </Typography>
              <Typography variant="body2">
                <strong>Harvard</strong> and <strong>Stanford</strong> dominated the 2000s and 2010s, frequently holding #1 or #2.
                In recent years (2021-2025), <strong>Wharton</strong> has emerged as the leader, holding #1 or tying 
                for #1 for four of the last five years. These three schools have historically been the most prestigious MBA programs.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, backgroundColor: '#e3f2fd' }}>
              <Typography variant="h6" color="primary" gutterBottom>
                📈 Dramatic Climbers: Chicago Booth & Columbia
              </Typography>
              <Typography variant="body2">
                <strong>Chicago Booth</strong> made a remarkable ascent from #9 (2001) to #1 (2018, 2023), now a permanent 
                fixture in the top 4. <strong>Kellogg</strong> surged to #2 (2023-2025) after years in the #3-6 range. 
                <strong> NYU Stern</strong> climbed from #12-13 to #6-7 in recent years.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, backgroundColor: '#fff3e0' }}>
              <Typography variant="h6" color="warning.main" gutterBottom>
                🔄 Recent Power Shift: 2021-2025
              </Typography>
              <Typography variant="body2">
                <strong>Wharton</strong> regained dominance with #1 rankings in 2021, 2024, and 2025. <strong>Harvard</strong> 
                experienced an unprecedented drop to #6 in 2021-2025, its lowest ranking ever. Meanwhile, <strong>Kellogg</strong> 
                surged to #2, and <strong>Dartmouth Tuck</strong> re-entered the top 6-7 after years at #9-12.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, backgroundColor: '#fce4ec' }}>
              <Typography variant="h6" color="secondary.main" gutterBottom>
                ⏳ Historical Eras: MBA Rankings Dominance
              </Typography>
              <Typography variant="body2">
                <strong>2001-2010:</strong> Harvard & Stanford era - these two schools held #1 or tied for #1 almost every year.<br />
                <strong>2011-2017:</strong> The rise of Booth - Chicago Booth joined the elite, achieving #1 in 2018.<br />
                <strong>2018-2025:</strong> Wharton's resurgence - Wharton dominated recent years while Harvard slipped to #5-6.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Poets & Quants Composite Rankings Dashboard */}
      <Box sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  📊 Composite MBA Rankings Dashboard (Multiple Sources)
                  {viewType === 'decade' && ' - Decade View (2015-2025)'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {viewType === 'decade' 
                    ? 'Schools ranked by average position across the decade (2015-2025) using <strong>Official U.S. News MBA Rankings</strong>, Financial Times, Bloomberg Businessweek, Forbes, LinkedIn, Princeton Review & The Economist'
                    : 'Schools ranked by average position across <strong>Official U.S. News MBA Rankings</strong>, Financial Times, Bloomberg Businessweek, Forbes, LinkedIn, Princeton Review & The Economist'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <ToggleButtonGroup
                  value={viewType}
                  exclusive
                  onChange={(e, newValue) => {
                    if (newValue !== null) {
                      setViewType(newValue);
                    }
                  }}
                  size="small"
                >
                  <ToggleButton value="single">Single Year</ToggleButton>
                  <ToggleButton value="decade">Decade (2015-2025)</ToggleButton>
                  <ToggleButton value="all">All Years Combined</ToggleButton>
                </ToggleButtonGroup>
                
                {viewType === 'single' && availablePQYears.length > 0 && (
                  <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>Year</InputLabel>
                    <Select
                      value={selectedPQYear}
                      label="Year"
                      onChange={(e) => setSelectedPQYear(e.target.value)}
                    >
                      {availablePQYears.map(year => (
                        <MenuItem key={year} value={year}>{year}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
            </Box>
            
            <Paper sx={{ p: 2, mb: 3, backgroundColor: '#e3f2fd', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                💡 Understanding the Rankings Shown
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Important:</strong> {viewType === 'decade' 
                  ? 'This view shows decade-long averages (2015-2025) similar to Poets & Quants\' "Best of the Decade" rankings.'
                  : viewType === 'all'
                  ? 'This view shows all-time averages across all available years.'
                  : 'This view shows rankings for a single selected year.'}
              </Typography>
              <Box sx={{ pl: 2, mb: 2 }}>
                <Typography variant="body2" paragraph>
                  <strong>1. U.S. News Only Average:</strong> Calculated from official U.S. News MBA rankings 
                  {viewType === 'decade' ? ' (2015-2025)' : viewType === 'all' ? ' (2001-2025)' : ` (${selectedPQYear})`}. 
                  This is shown in the school statistics cards above. Example: Harvard = #2.13 (U.S. News only).
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>2. Composite Average:</strong> Calculated across MULTIPLE sources (U.S. News + Financial Times + 
                  BusinessWeek + Forbes + LinkedIn + Princeton Review + Economist) 
                  {viewType === 'decade' ? 'averaged over the decade (2015-2025)' : viewType === 'all' ? 'averaged over all years' : `for ${selectedPQYear}`}. 
                  This is what's shown in the cards below. Example: Harvard might be #3.5 when averaging across all sources.
                </Typography>
              </Box>
              <Typography variant="body2" color="warning.main" sx={{ fontWeight: 'bold' }}>
                ⚠️ These will differ! A school can rank #2 in U.S. News but #4 in composite if other sources rank it differently.
              </Typography>
            </Paper>

            {poetsQuantsData.length > 0 && (
              <Grid container spacing={2}>
                {viewType === 'all' || viewType === 'decade' ? (
                  // All Years Combined or Decade View
                  [...new Set(poetsQuantsData.map(d => d.School))]
                    .map(schoolName => ({
                      School: schoolName,
                      historicalData: viewType === 'decade' 
                        ? calculateHistoricalAverages(schoolName, [2015, 2025])
                        : calculateHistoricalAverages(schoolName)
                    }))
                    .filter(school => school.historicalData !== null)
                    .sort((a, b) => a.historicalData.overallAverage - b.historicalData.overallAverage)
                    .slice(0, 25)
                    .map((school, idx) => {
                      const histData = school.historicalData;
                      const displayRank = idx + 1;
                      
                      return (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
                          <Card sx={{ 
                            height: '100%',
                            backgroundColor: displayRank <= 3 ? '#fff9c4' : displayRank <= 10 ? '#e8f5e9' : '#ffffff',
                            border: displayRank <= 3 ? '2px solid #ffd54f' : displayRank <= 10 ? '1px solid #81c784' : '1px solid #e0e0e0',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: 4
                            }
                          }}>
                            <CardContent>
                              {/* Rank Badge */}
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                <Chip 
                                  label={`#${displayRank}`}
                                  color={displayRank <= 3 ? 'warning' : displayRank <= 10 ? 'success' : 'default'}
                                  sx={{ fontWeight: 'bold', fontSize: '1rem' }}
                                />
                                <Chip 
                                  label={`${histData.yearsOfData} years`}
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>

                              {/* School Name */}
                              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ minHeight: '3rem' }}>
                                {school.School}
                              </Typography>

                              {/* Historical Average */}
                              <Box sx={{ 
                                mb: 2, 
                                p: 1.5, 
                                backgroundColor: displayRank <= 5 ? 'rgba(76, 175, 80, 0.15)' : 'rgba(33, 150, 243, 0.1)', 
                                borderRadius: 1,
                                textAlign: 'center',
                                border: displayRank <= 5 ? '2px solid #4caf50' : '2px solid #2196f3'
                              }}>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {viewType === 'decade' ? 'Decade Average (2015-2025)' : 'Historical Average Ranking'}
                                </Typography>
                                <Typography variant="h4" fontWeight="bold" color={displayRank <= 5 ? 'success.main' : 'primary'}>
                                  #{histData.overallAverage.toFixed(1)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Across {histData.totalSources} sources
                                </Typography>
                              </Box>

                              {/* Component Averages */}
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, fontWeight: 'bold' }}>
                                Average by Source (Years):
                              </Typography>
                              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75 }}>
                                {histData.componentAverages.US_News && (
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      U.S. News ({histData.componentAverages.US_News.count}y)
                                    </Typography>
                                    <Typography variant="body2" fontWeight="600">
                                      #{histData.componentAverages.US_News.average.toFixed(1)}
                                    </Typography>
                                  </Box>
                                )}
                                {histData.componentAverages.Financial_Times && (
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      FT ({histData.componentAverages.Financial_Times.count}y)
                                    </Typography>
                                    <Typography variant="body2" fontWeight="600">
                                      #{histData.componentAverages.Financial_Times.average.toFixed(1)}
                                    </Typography>
                                  </Box>
                                )}
                                {histData.componentAverages.BusinessWeek && (
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      BWeek ({histData.componentAverages.BusinessWeek.count}y)
                                    </Typography>
                                    <Typography variant="body2" fontWeight="600">
                                      #{histData.componentAverages.BusinessWeek.average.toFixed(1)}
                                    </Typography>
                                  </Box>
                                )}
                                {histData.componentAverages.Forbes && (
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      Forbes ({histData.componentAverages.Forbes.count}y)
                                    </Typography>
                                    <Typography variant="body2" fontWeight="600">
                                      #{histData.componentAverages.Forbes.average.toFixed(1)}
                                    </Typography>
                                  </Box>
                                )}
                                {histData.componentAverages.LinkedIn && (
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      LinkedIn ({histData.componentAverages.LinkedIn.count}y)
                                    </Typography>
                                    <Typography variant="body2" fontWeight="600">
                                      #{histData.componentAverages.LinkedIn.average.toFixed(1)}
                                    </Typography>
                                  </Box>
                                )}
                                {histData.componentAverages.Princeton_Review && (
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      PR ({histData.componentAverages.Princeton_Review.count}y)
                                    </Typography>
                                    <Typography variant="body2" fontWeight="600">
                                      #{histData.componentAverages.Princeton_Review.average.toFixed(1)}
                                    </Typography>
                                  </Box>
                                )}
                                {histData.componentAverages.Economist && (
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      Economist ({histData.componentAverages.Economist.count}y)
                                    </Typography>
                                    <Typography variant="body2" fontWeight="600">
                                      #{histData.componentAverages.Economist.average.toFixed(1)}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })
                ) : (
                  // Single Year View
                  poetsQuantsData
                  .filter(d => d.Year === selectedPQYear)
                  .map(school => ({
                    ...school,
                    avgRank: calculateAverageComponentRank(school)
                  }))
                  .filter(school => school.avgRank !== null)
                  .sort((a, b) => a.avgRank.average - b.avgRank.average)
                  .slice(0, 25)
                  .map((school, idx) => {
                    const avgData = school.avgRank;
                    const displayRank = idx + 1;
                    
                    // Get previous year data for trend
                    const prevYear = (parseInt(selectedPQYear) - 1).toString();
                    const prevSchoolData = poetsQuantsData
                      .filter(d => d.Year === prevYear && d.School === school.School)
                      .map(s => ({
                        ...s,
                        avgRank: calculateAverageComponentRank(s)
                      }))[0];
                    
                    let rankChange = null;
                    if (prevSchoolData && prevSchoolData.avgRank) {
                      const prevRank = poetsQuantsData
                        .filter(d => d.Year === prevYear)
                        .map(s => ({
                          ...s,
                          avgRank: calculateAverageComponentRank(s)
                        }))
                        .filter(s => s.avgRank !== null)
                        .sort((a, b) => a.avgRank.average - b.avgRank.average)
                        .findIndex(s => s.School === school.School) + 1;
                      
                      if (prevRank > 0) {
                        rankChange = prevRank - displayRank; // Positive = improved
                      }
                    }
                    
                    const missingData = avgData.count < 4;
                    
                    return (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
                        <Card sx={{ 
                          height: '100%',
                          backgroundColor: displayRank <= 3 ? '#fff9c4' : displayRank <= 10 ? '#e8f5e9' : '#ffffff',
                          border: displayRank <= 3 ? '2px solid #ffd54f' : displayRank <= 10 ? '1px solid #81c784' : '1px solid #e0e0e0',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4
                          }
                        }}>
                          <CardContent>
                            {/* Rank Badge */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                              <Chip 
                                label={`#${displayRank}`}
                                color={displayRank <= 3 ? 'warning' : displayRank <= 10 ? 'success' : 'default'}
                                sx={{ fontWeight: 'bold', fontSize: '1rem' }}
                              />
                              {rankChange !== null && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  {rankChange > 0 ? (
                                    <>
                                      <TrendingUp sx={{ color: 'success.main', fontSize: 18 }} />
                                      <Typography variant="caption" color="success.main" fontWeight="bold">
                                        +{rankChange}
                                      </Typography>
                                    </>
                                  ) : rankChange < 0 ? (
                                    <>
                                      <TrendingDown sx={{ color: 'error.main', fontSize: 18 }} />
                                      <Typography variant="caption" color="error.main" fontWeight="bold">
                                        {rankChange}
                                      </Typography>
                                    </>
                                  ) : (
                                    <TrendingFlat sx={{ color: 'text.secondary', fontSize: 18 }} />
                                  )}
                                </Box>
                              )}
                            </Box>

                            {/* School Name */}
                            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ minHeight: '3rem' }}>
                              {school.School}
                            </Typography>

                            {/* Average Ranking */}
                            <Box sx={{ 
                              mb: 2, 
                              p: 1.5, 
                              backgroundColor: displayRank <= 5 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(0, 0, 0, 0.05)', 
                              borderRadius: 1,
                              textAlign: 'center',
                              border: displayRank <= 5 ? '2px solid #4caf50' : 'none'
                            }}>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Average Ranking
                              </Typography>
                              <Typography variant="h4" fontWeight="bold" color={displayRank <= 5 ? 'success.main' : 'primary'}>
                                #{avgData.average.toFixed(1)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Across {avgData.count} source{avgData.count > 1 ? 's' : ''}
                              </Typography>
                            </Box>

                            {/* Component Rankings */}
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, fontWeight: 'bold' }}>
                              Component Rankings:
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75 }}>
                              {(() => {
                                // Get official U.S. News ranking
                                const usNewsRanking = usNewsData.find(
                                  d => d.School === school.School && d.Year === school.Year
                                );
                                const displayUSNews = usNewsRanking ? usNewsRanking.Rank : school.US_News;
                                
                                return displayUSNews && displayUSNews.toString().trim() !== '' && (
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      U.S. News {usNewsRanking && '✓'}
                                    </Typography>
                                    <Typography variant="body2" fontWeight="600">
                                      #{displayUSNews}
                                    </Typography>
                                  </Box>
                                );
                              })()}
                              {school.Financial_Times && school.Financial_Times.trim() !== '' && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    FT
                                  </Typography>
                                  <Typography variant="body2" fontWeight="600">
                                    #{school.Financial_Times}
                                  </Typography>
                                </Box>
                              )}
                              {school.BusinessWeek && school.BusinessWeek.trim() !== '' && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    BusinessWeek
                                  </Typography>
                                  <Typography variant="body2" fontWeight="600">
                                    #{school.BusinessWeek}
                                  </Typography>
                                </Box>
                              )}
                              {school.Forbes && school.Forbes.trim() !== '' && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Forbes
                                  </Typography>
                                  <Typography variant="body2" fontWeight="600">
                                    #{school.Forbes}
                                  </Typography>
                                </Box>
                              )}
                              {school.LinkedIn && school.LinkedIn.trim() !== '' && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    LinkedIn
                                  </Typography>
                                  <Typography variant="body2" fontWeight="600">
                                    #{school.LinkedIn}
                                  </Typography>
                                </Box>
                              )}
                              {school.Princeton_Review && school.Princeton_Review.trim() !== '' && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Princeton R.
                                  </Typography>
                                  <Typography variant="body2" fontWeight="600">
                                    #{school.Princeton_Review}
                                  </Typography>
                                </Box>
                              )}
                              {school.Economist && school.Economist.trim() !== '' && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Economist
                                  </Typography>
                                  <Typography variant="body2" fontWeight="600">
                                    #{school.Economist}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                            
                            {missingData && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                                Limited data ({avgData.count} sources)
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })
                )}
              </Grid>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default Rankings;

