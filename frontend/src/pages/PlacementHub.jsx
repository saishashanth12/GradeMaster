import React, { useState, useEffect } from 'react';
import { 
  Building, MapPin, Calendar, GraduationCap, Search, Filter, 
  Sparkles, Download, CheckCircle2, AlertCircle, ArrowRight, 
  X, ChevronRight, Cpu, Award, RefreshCw, Briefcase, FileText
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';

const PlacementHub = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState([]);
  const [studentMetrics, setStudentMetrics] = useState({ academics: 85, technical: 80, certifications: 75 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [activeJobDetail, setActiveJobDetail] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 1. fetchAppliedJobs: Asynchronously fetch evaluation data from Express endpoint
  const fetchAppliedJobs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('gm_token');
      if (!token) {
        toast.error('Session expired. Please log in.');
        navigate('/login');
        return;
      }

      const res = await axios.get('/api/placement-hub/analyzed-opportunities', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setOpportunities(res.data.opportunities || []);
      setFilteredOpportunities(res.data.opportunities || []);
      if (res.data.student_metrics) {
        setStudentMetrics(res.data.student_metrics);
      }
    } catch (err) {
      console.error('Failed to fetch placement hub data:', err);
      toast.error('Failed to fetch analyzed opportunities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppliedJobs();
  }, []);

  // 2. fetchJobDetails: Fetch detailed info of a single vacancy
  const fetchJobDetails = async (jobId) => {
    try {
      const token = localStorage.getItem('gm_token');
      const res = await axios.get(`/api/placement-hub/job/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveJobDetail(res.data);
      setIsDrawerOpen(true);
    } catch (err) {
      console.error('Error fetching job details:', err);
      toast.error('Failed to retrieve job details.');
    }
  };

  // 3. calculateProximityScore: STRICT architectural formula
  const calculateProximityScore = (academics, technical, certifications) => {
    return Math.round((0.40 * academics) + (0.40 * technical) + (0.20 * certifications));
  };

  // 4. mapSkillGapsAndMatches: Partition keywords
  const mapSkillGapsAndMatches = (job) => {
    const matched = job.matched_keywords || [];
    const missing = job.missing_keywords || [];
    return { matched, missing };
  };

  // Helper to handle both search and filter operations in unified state
  const applyFiltersAndSearch = (query, status) => {
    let results = [...opportunities];

    // Filter by status
    if (status !== 'All') {
      results = results.filter(opp => {
        if (status === 'Applied') return opp.status === 'Applied';
        return opp.status !== 'Applied';
      });
    }

    // Filter by query (company, role, description keywords)
    if (query.trim() !== '') {
      const lq = query.toLowerCase();
      results = results.filter(opp => 
        (opp.company_name?.toLowerCase().includes(lq)) ||
        (opp.role_title?.toLowerCase().includes(lq)) ||
        (opp.location?.toLowerCase().includes(lq)) ||
        (opp.keywords && opp.keywords.some(k => k.toLowerCase().includes(lq)))
      );
    }

    setFilteredOpportunities(results);
  };

  // 5. filterJobsByStatus: Filter displayed list
  const filterJobsByStatus = (status) => {
    setSelectedStatus(status);
    applyFiltersAndSearch(searchQuery, status);
  };

  // 6. searchCorporatePositions: Search positions by query
  const searchCorporatePositions = (query) => {
    setSearchQuery(query);
    applyFiltersAndSearch(query, selectedStatus);
  };

  // 7. applyToJob: Send apply action, update state
  const applyToJob = async (jobId) => {
    try {
      const token = localStorage.getItem('gm_token');
      const res = await axios.post('/api/placement-hub/apply', { job_id: jobId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message || 'Applied successfully!');
      
      // Update local states
      const updatedOpps = opportunities.map(opp => opp.id === jobId ? { ...opp, status: 'Applied' } : opp);
      setOpportunities(updatedOpps);
      
      // Re-apply filter on current set
      let currentFiltered = filteredOpportunities.map(opp => opp.id === jobId ? { ...opp, status: 'Applied' } : opp);
      setFilteredOpportunities(currentFiltered);

      if (activeJobDetail && activeJobDetail.id === jobId) {
        setActiveJobDetail(prev => ({ ...prev, status: 'Applied' }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit application.');
    }
  };

  // 8. withdrawApplication: Withdraw action, update state
  const withdrawApplication = async (jobId) => {
    try {
      const token = localStorage.getItem('gm_token');
      const res = await axios.post('/api/placement-hub/withdraw', { job_id: jobId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message || 'Withdrawn successfully!');
      
      // Update local states
      const updatedOpps = opportunities.map(opp => opp.id === jobId ? { ...opp, status: 'Not Applied' } : opp);
      setOpportunities(updatedOpps);

      // Re-apply filter on current set
      let currentFiltered = filteredOpportunities.map(opp => opp.id === jobId ? { ...opp, status: 'Not Applied' } : opp);
      setFilteredOpportunities(currentFiltered);

      if (activeJobDetail && activeJobDetail.id === jobId) {
        setActiveJobDetail(prev => ({ ...prev, status: 'Not Applied' }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to withdraw application.');
    }
  };

  // 9. downloadJobDescription: Download JD as local file asset
  const downloadJobDescription = (jobId, companyName, roleTitle, description) => {
    const textContent = `
=============================================
GRADE MASTER CAREER INTELLIGENCE SYSTEM
VACANCY DESCRIPTION ASSET
=============================================

Company: ${companyName}
Role Designation: ${roleTitle}
File Hash Identifier: GM-JD-${jobId}

---------------------------------------------
Job Specifications & Details:
---------------------------------------------
${description}

---------------------------------------------
Generated by GradeMaster Dynamic Sandbox.
`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${companyName.replace(/\s+/g, '_')}_${roleTitle.replace(/\s+/g, '_')}_JD.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Vacancy description asset downloaded.');
  };

  // 11. toggleSkillTagStyles: Return styled badges based on matches
  const toggleSkillTagStyles = (skill, isMatched) => {
    return isMatched 
      ? 'px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/50 flex items-center gap-1 shadow-sm'
      : 'px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-500 border border-rose-100 flex items-center gap-1 shadow-sm';
  };

  // 12. verifyAcademicEligibility: Standard academic eligibility verification check
  const verifyAcademicEligibility = (academicScore) => {
    return academicScore >= 75; // Requires 75% or higher
  };

  // Helper to format date cleanly
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // 10. renderBentoCardGrid: Render standard dynamic sandbox grid
  const renderBentoCardGrid = () => {
    if (filteredOpportunities.length === 0) {
      return (
        <div className="lg:col-span-8 flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Briefcase className="text-gray-400" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">No Evaluated Opportunities</h3>
          <p className="text-sm text-gray-500 max-w-sm mb-6">
            The Sandbox is empty. Please run a job evaluation in the Proximity Analyzer to cache job profile records here.
          </p>
          <Link 
            to="/proximity-analyzer" 
            className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors inline-flex items-center gap-2 text-sm shadow-md"
          >
            Go to Proximity Analyzer <ArrowRight size={16} />
          </Link>
        </div>
      );
    }

    return (
      <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredOpportunities.map((opp, idx) => {
          // Compute bento sizes dynamically (first item is featured)
          const isFeatured = idx === 0;
          const { matched, missing } = mapSkillGapsAndMatches(opp);
          const isAcademicEligible = verifyAcademicEligibility(opp.academics_score);

          return (
            <div 
              key={opp.id} 
              className={`group bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_25px_-5px_rgba(99,102,241,0.03)] hover:shadow-[0_12px_35px_-5px_rgba(99,102,241,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col relative overflow-hidden ${
                isFeatured ? 'md:col-span-2' : ''
              }`}
              onClick={() => fetchJobDetails(opp.id)}
            >
              {/* Top Accent Gradient Border */}
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-indigo-500 to-indigo-300"></div>

              {/* Title Block */}
              <div className="flex justify-between items-start mb-4 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50/70 border border-indigo-100/50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {opp.company_name}
                    </span>
                    {opp.status === 'Applied' && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-0.5">
                        <CheckCircle2 size={10} /> Applied
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mt-1 tracking-tight group-hover:text-indigo-600 transition-colors">
                    {opp.role_title}
                  </h3>
                </div>
                
                {/* Proximity Score Gauge */}
                <div className="flex flex-col items-end">
                  <div className="text-2xl font-black text-indigo-600 tracking-tight flex items-baseline">
                    {opp.selection_probability}%
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Match Score</span>
                </div>
              </div>

              {/* Meta information tags */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 mb-6">
                <div className="flex items-center gap-1">
                  <MapPin size={14} className="text-indigo-400" />
                  <span>{opp.location || 'Remote'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={14} className="text-indigo-400" />
                  <span>Deadline: {formatDate(opp.deadline_date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <GraduationCap size={14} className="text-indigo-400" />
                  <span className={isAcademicEligible ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                    {isAcademicEligible ? 'Eligible' : 'Needs Review'}
                  </span>
                </div>
              </div>

              {/* Tech Stack prereq list (Bento cards layout details) */}
              <div className="mb-6 flex-grow">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Technical Profile Requirements</p>
                <div className="flex flex-wrap gap-1.5">
                  {(opp.keywords || []).slice(0, isFeatured ? 8 : 4).map((kw, i) => {
                    const isMatched = matched.map(m => m.toLowerCase()).includes(kw.toLowerCase());
                    return (
                      <span 
                        key={i} 
                        className={`px-2.5 py-1 text-xs rounded-md font-medium border ${
                          isMatched 
                            ? 'bg-emerald-50/40 text-emerald-700 border-emerald-100' 
                            : 'bg-slate-50 text-slate-500 border-slate-100'
                        }`}
                      >
                        {kw}
                      </span>
                    );
                  })}
                  {(opp.keywords || []).length > (isFeatured ? 8 : 4) && (
                    <span className="px-2.5 py-1 text-xs rounded-md font-medium bg-slate-50 text-slate-400 border border-slate-100">
                      +{ (opp.keywords || []).length - (isFeatured ? 8 : 4) } more
                    </span>
                  )}
                </div>
              </div>

              {/* Interactive View Details Action footer */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <span className="text-xs text-indigo-600 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Analyze Skill Intersections & Upskilling <ArrowRight size={14} />
                </span>
                <span className="text-xs text-slate-400">
                  Evaluated {formatDate(opp.updated_at)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] font-['Inter'] relative overflow-x-hidden">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-10 relative">
        {/* Decorative Glowing Elements */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-400/5 rounded-full filter blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-teal-400/5 rounded-full filter blur-3xl pointer-events-none"></div>

        {/* Dashboard Header section */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full flex items-center gap-1 animate-pulse">
                <Cpu size={12} /> Sandbox Mode
              </span>
            </div>
            <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Dynamic Career Intelligence Sandbox</h1>
            <p className="text-gray-500 text-sm mt-1 max-w-xl">
              Inspect selection probabilities computed dynamically from Proximity evaluations. Optimize candidate positioning and map critical skill gaps.
            </p>
          </div>

          <button 
            onClick={fetchAppliedJobs}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync Sandbox</span>
          </button>
        </div>

        {/* Bento Controls Row: Search + Filter status */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search control */}
          <div className="relative flex-grow max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </span>
            <input 
              type="text"
              placeholder="Search evaluated companies, roles or tech stack keywords..."
              value={searchQuery}
              onChange={(e) => searchCorporatePositions(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Filter Status Control */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
              <Filter size={14} /> Filter Status:
            </span>
            {['All', 'Applied', 'Not Applied'].map((status) => (
              <button
                key={status}
                onClick={() => filterJobsByStatus(status)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedStatus === status 
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Grid panel container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT BENTO ELEMENT: Student Core Credentials Dashboard Card */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-slate-800 relative overflow-hidden flex flex-col justify-between min-h-[360px]">
              {/* Background gradient orb decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full filter blur-2xl pointer-events-none"></div>

              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/20">
                      <GraduationCap size={20} className="text-indigo-300" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Credentials Profile</span>
                  </div>
                  <div className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                    DNA Sync Verified
                  </div>
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Student Sandbox Core</h2>
                <p className="text-indigo-200/70 text-xs mb-8">
                  Core stats mapping selection calculations. Adjust parameters in Profile Settings.
                </p>

                {/* Score Formula Breakdown elements */}
                <div className="space-y-4">
                  {/* Academics Score */}
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <GraduationCap size={16} className="text-indigo-300" />
                      <span className="text-xs font-medium text-indigo-100">Academic Score (40%)</span>
                    </div>
                    <span className="text-sm font-bold text-white">{studentMetrics.academics}%</span>
                  </div>

                  {/* Technical Score */}
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <Cpu size={16} className="text-indigo-300" />
                      <span className="text-xs font-medium text-indigo-100">Tech Capabilities (40%)</span>
                    </div>
                    <span className="text-sm font-bold text-white">{studentMetrics.technical}%</span>
                  </div>

                  {/* Certifications Score */}
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <Award size={16} className="text-indigo-300" />
                      <span className="text-xs font-medium text-indigo-100">Certifications (20%)</span>
                    </div>
                    <span className="text-sm font-bold text-white">{studentMetrics.certifications}%</span>
                  </div>
                </div>
              </div>

              {/* Strict Probability Indicator summary */}
              <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Hiring Probability Scale</span>
                <span className="text-lg font-black text-white">
                  {calculateProximityScore(studentMetrics.academics, studentMetrics.technical, studentMetrics.certifications)}%
                </span>
              </div>
            </div>

            {/* QUICK SANDBOX INSTRUCTIONS */}
            <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100/50">
              <h4 className="text-sm font-bold text-indigo-950 mb-2 flex items-center gap-1.5">
                <Sparkles size={16} className="text-indigo-500" /> Career Intelligence Sandbox
              </h4>
              <p className="text-indigo-900/70 text-xs leading-relaxed">
                This sandbox displays candidate recruitment criteria. Click **View Details** on any card to run an in-depth alignment check detailing skill intersections, gaps checklist, and recommended upskilling paths.
              </p>
            </div>
          </div>

          {/* RIGHT BENTO ELEMENT: The evaluated vacancy cards grid */}
          {loading ? (
            <div className="lg:col-span-8 flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-slate-500">Querying database evaluation logs...</p>
            </div>
          ) : (
            renderBentoCardGrid()
          )}

        </div>
      </main>

      {/* DETAILED VIEW SLIDE DRAWER MODAL OVERLAY */}
      {isDrawerOpen && activeJobDetail && (
        <div className="fixed inset-0 z-50 overflow-hidden font-['Inter'] animate-in fade-in duration-300">
          {/* Glassmorphic Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          ></div>

          {/* Slide out panel panel container */}
          <div className="absolute inset-y-0 right-0 max-w-2xl w-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{activeJobDetail.company_name} Details</span>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{activeJobDetail.role_title}</h2>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body Scroll Content */}
            <div className="flex-grow overflow-y-auto p-8 space-y-8">
              
              {/* Job Specification Meta Card */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Vacancy Specifications</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400">Workspace</span>
                    <span className="font-semibold text-slate-700 mt-0.5">{activeJobDetail.location || 'Remote'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400">Application Deadline</span>
                    <span className="font-semibold text-slate-700 mt-0.5">{formatDate(activeJobDetail.deadline_date)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400">Selection Probability</span>
                    <span className="font-extrabold text-indigo-600 mt-0.5">{activeJobDetail.selection_probability}%</span>
                  </div>
                </div>
              </div>

              {/* Full Corporate breakdown */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Role Overview & Responsibilities</h3>
                <div className="text-sm text-slate-600 leading-relaxed bg-white border border-slate-100 rounded-2xl p-5 shadow-sm whitespace-pre-line">
                  {activeJobDetail.description}
                </div>
              </div>

              {/* Intersection details: exact matched parameters & skill gaps checklist */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Technical Competency Analysis</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Exact Matched Parameters */}
                  <div className="bg-emerald-50/30 border border-emerald-100/60 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3 text-emerald-700">
                      <CheckCircle2 size={18} />
                      <h4 className="font-bold text-sm">Matched Strengths</h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(activeJobDetail.matched_keywords || []).length > 0 ? (
                        (activeJobDetail.matched_keywords || []).map((skill, idx) => (
                          <span key={idx} className={toggleSkillTagStyles(skill, true)}>
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">No matching technical skills cached.</span>
                      )}
                    </div>
                  </div>

                  {/* Skill Gap Checklist */}
                  <div className="bg-rose-50/20 border border-rose-100/60 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3 text-rose-500">
                      <AlertCircle size={18} />
                      <h4 className="font-bold text-sm">Identified Gaps Checklist</h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(activeJobDetail.missing_keywords || []).length > 0 ? (
                        (activeJobDetail.missing_keywords || []).map((skill, idx) => (
                          <span key={idx} className={toggleSkillTagStyles(skill, false)}>
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">All technical parameters matched perfectly!</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Adaptive Upskilling Tracking Path */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/30 rounded-2xl p-6 border border-indigo-100">
                <h4 className="font-bold text-indigo-950 text-sm mb-2 flex items-center gap-1.5">
                  <Sparkles size={16} className="text-indigo-500 animate-pulse" /> Adaptive Upskilling Path
                </h4>
                <p className="text-indigo-900/70 text-xs mb-4">
                  To achieve 100% technical intersection for this role, we recommend covering the following tracks:
                </p>

                <div className="space-y-3">
                  {(activeJobDetail.missing_keywords || []).length > 0 ? (
                    (activeJobDetail.missing_keywords || []).map((skill, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-indigo-100/50 rounded-xl">
                        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600">
                          {idx + 1}
                        </div>
                        <div className="flex-grow">
                          <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">Focus Track: {skill}</p>
                          <p className="text-[10px] text-slate-500">Recommended Udemy, Coursera, or system certification resources</p>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                          Suggested course
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-white border border-indigo-100/50 rounded-xl text-center">
                      <p className="text-xs font-bold text-emerald-600">No skill gaps identified. You have maximum alignment!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Academic eligibility verification */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <GraduationCap size={22} className="text-slate-400" />
                <div className="flex-grow">
                  <p className="text-xs font-bold text-slate-700">Academic Eligibility Verification</p>
                  <p className="text-[11px] text-slate-500">Academic score: {activeJobDetail.academics_score}% (Min required: 75%)</p>
                </div>
                <div>
                  {verifyAcademicEligibility(activeJobDetail.academics_score) ? (
                    <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm">
                      <CheckCircle2 size={12} /> Verified Eligible
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-50 border border-amber-100 text-amber-600 text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm">
                      <AlertCircle size={12} /> Review Recommended
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* Drawer Actions Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
              <button 
                onClick={() => downloadJobDescription(activeJobDetail.id, activeJobDetail.company_name, activeJobDetail.role_title, activeJobDetail.description)}
                className="flex items-center justify-center gap-2 px-5 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-200/50 hover:text-slate-800 transition-colors shadow-sm bg-white"
              >
                <Download size={16} />
                <span>Download Specification</span>
              </button>

              <div className="flex items-center gap-3">
                {activeJobDetail.status === 'Applied' ? (
                  <button 
                    onClick={() => withdrawApplication(activeJobDetail.id)}
                    className="px-6 py-3 bg-rose-50 border border-rose-100 hover:bg-rose-100/55 text-rose-600 text-sm font-bold rounded-xl transition-colors shadow-sm"
                  >
                    Withdraw Application
                  </button>
                ) : (
                  <button 
                    onClick={() => applyToJob(activeJobDetail.id)}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-indigo-600/20"
                  >
                    Apply for Position
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementHub;
