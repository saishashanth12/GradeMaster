import React, { useState, useEffect } from 'react';
import { Sparkles, ScanEye, CheckCircle2, AlertCircle, FileText, ChevronDown, ArrowLeft, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

// Semi-circular Match Score Gauge
const ScoreGauge = ({ score }) => {
  const radius = 80;
  const stroke = 14;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = '#ef4444'; // Red
  if (score >= 70) color = '#22c55e'; // Green
  else if (score >= 40) color = '#f59e0b'; // Amber

  return (
    <div className="relative flex flex-col items-center justify-center pt-8 pb-4">
      <svg height={radius + 10} width={radius * 2} className="overflow-visible">
        {/* Background Arc */}
        <path
          d={`M ${stroke * 2} ${radius} A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius * 2 - stroke * 2} ${radius}`}
          fill="transparent"
          stroke="#f1f5f9"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Foreground Arc */}
        <path
          d={`M ${stroke * 2} ${radius} A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius * 2 - stroke * 2} ${radius}`}
          fill="transparent"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-in-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center bottom-4">
        <span className="text-5xl font-bold tracking-tight text-slate-800">{score}%</span>
        <span className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wider">Match Score</span>
      </div>
    </div>
  );
};

const ProximityAnalyzer = () => {
  const navigate = useNavigate();
  const [dbJobs, setDbJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [customJobText, setCustomJobText] = useState('');
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);

  // Fetch jobs dynamically from backend
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem('gm_token');
        if (!token) return;
        const response = await axios.get('/api/intelligence/jobs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDbJobs(response.data.map(job => ({
          id: job.id,
          title: `${job.role_title} @ ${job.company_name}`
        })));
      } catch (e) {
        console.error('Failed to fetch jobs list:', e);
      }
    };
    fetchJobs();
  }, []);

  const handleAnalysis = async () => {
    if (!selectedJobId && !customJobText.trim()) {
      toast.error('Please select a job or paste a job description.');
      return;
    }

    setLoadingStatus(true);
    try {
      const token = localStorage.getItem('gm_token');
      if (!token) {
        toast.error('Authentication required. Please log in.');
        navigate('/login');
        return;
      }

      const payload = {};
      if (selectedJobId) payload.job_id = selectedJobId;
      if (customJobText) payload.job_description_text = customJobText;

      const response = await axios.post('/api/intelligence/analyzer', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAnalysisResults({
        matchScore: response.data.proximity_score,
        matchedKeywords: response.data.matched_keywords || [],
        missingKeywords: response.data.missing_keywords || []
      });
      
      toast.success('Analysis complete! Review your alignment below.');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Failed to analyze alignment. Please try again.');
    } finally {
      setLoadingStatus(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] font-['Inter'] text-gray-800">
      {/* Navigation Header (Persisting structure from Dashboard) */}
      <Navbar />

      {/* Main Content Area */}
      <main className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors"><ArrowLeft size={20} /></Link>
              <h1 className="text-3xl font-semibold text-[var(--color-primary-navy)] tracking-tight">Selection Proximity Analyzer</h1>
            </div>
            <p className="text-gray-500 text-sm ml-7">Calculate your alignment with specific job requirements and identify skill gaps.</p>
          </div>
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT PANEL: Control Center */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-6 text-[var(--color-electric-blue)]">
                <FileText size={22} />
                <h2 className="text-lg font-semibold text-[var(--color-primary-navy)]">Job Specification</h2>
              </div>

              {/* Database Select */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select a Target Role</label>
                <div className="relative">
                  <select
                    className="w-full appearance-none bg-[var(--background-white)] border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-blue)] focus:border-transparent transition-all"
                    value={selectedJobId}
                    onChange={(e) => {
                      setSelectedJobId(e.target.value);
                      if (e.target.value) setCustomJobText('');
                    }}
                  >
                    <option value="">-- Choose from our database --</option>
                    {dbJobs.map(job => (
                      <option key={job.id} value={job.id}>{job.title}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center my-2">
                <div className="flex-grow border-t border-gray-100"></div>
                <span className="flex-shrink-0 px-4 text-xs font-medium text-gray-400 uppercase tracking-widest">Or</span>
                <div className="flex-grow border-t border-gray-100"></div>
              </div>

              {/* Textarea */}
              <div className="mb-8 flex-grow flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-2">Paste Custom Job Description</label>
                <textarea
                  className="w-full flex-grow min-h-[220px] bg-[var(--background-white)] border border-gray-200 text-gray-700 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-blue)] focus:border-transparent transition-all resize-none"
                  placeholder="Paste the job description here... Include requirements, skills, responsibilities, and qualifications to get an accurate proximity score."
                  value={customJobText}
                  onChange={(e) => {
                    setCustomJobText(e.target.value);
                    if (e.target.value) setSelectedJobId('');
                  }}
                ></textarea>
              </div>

              {/* Action Button */}
              <button
                onClick={handleAnalysis}
                disabled={loadingStatus}
                className="w-full flex items-center justify-center gap-2 bg-[var(--color-electric-blue)] hover:bg-[#0284c7] text-white py-4 rounded-xl font-medium transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loadingStatus ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Sparkles size={20} />
                )}
                <span>{loadingStatus ? 'Analyzing Alignment...' : 'Analyze Proximity'}</span>
              </button>
            </div>
          </div>

          {/* RIGHT PANEL: Analytics View */}
          <div className="flex flex-col h-full">
            <div className={`bg-white rounded-2xl p-8 shadow-sm border border-gray-100 h-full flex flex-col ${!analysisResults ? 'items-center justify-center text-center' : ''}`}>
              
              {!analysisResults ? (
                /* Empty State */
                <div className="max-w-xs mx-auto opacity-60">
                  <div className="w-20 h-20 bg-[#f1f5f9] rounded-full flex items-center justify-center mx-auto mb-6">
                    <ScanEye size={36} className="text-[#94a3b8]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--color-primary-navy)] mb-2">Awaiting Data</h3>
                  <p className="text-sm text-gray-500">Provide a job specification on the left to instantly uncover your alignment score and skill gaps.</p>
                </div>
              ) : (
                /* Results View Redesigned to match references 4 and 5 */
                (() => {
                  const matchedCount = analysisResults.matchedKeywords.length;
                  const missingCount = analysisResults.missingKeywords.length;
                  const totalKeywords = matchedCount + missingCount;
                  const matchRate = totalKeywords > 0 ? Math.round((matchedCount / totalKeywords) * 100) : 0;
                  const matchScore = analysisResults.matchScore;

                  // Determine Match Tier
                  let matchTier = 'Needs Work';
                  let tierColor = 'bg-rose-50 text-rose-600 border border-rose-100/50';
                  if (matchScore >= 75) {
                    matchTier = 'Strong Match';
                    tierColor = 'bg-emerald-50 text-emerald-600 border border-emerald-200/50';
                  } else if (matchScore >= 50) {
                    matchTier = 'Good Match';
                    tierColor = 'bg-amber-50 text-amber-600 border border-amber-200/50';
                  }

                  return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col gap-6 h-full font-['Inter']">
                      
                      {/* CARD 1: Your Proximity Score Card */}
                      <div className="bg-white border border-[#e2e8f0] rounded-3xl p-6 shadow-[0_4px_20px_-2px_rgba(99,102,241,0.02)] flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Your Proximity Score</span>
                        
                        {/* Huge score percent */}
                        <h1 className="text-6xl font-black tracking-tight text-[#0084ff] mb-2">{matchScore}%</h1>
                        
                        {/* Pill badge */}
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${tierColor} mb-6`}>
                          {matchTier}
                        </span>

                        {/* Thicker horizontal progress bar */}
                        <div className="w-full bg-slate-100 rounded-full h-3 mb-6 overflow-hidden">
                          <div 
                            className="bg-[#0084ff] h-full rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${matchScore}%` }}
                          />
                        </div>

                        {/* Breakdown Row */}
                        <div className="grid grid-cols-2 w-full gap-4 pt-4 border-t border-slate-100">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Skills Match</p>
                            <p className="text-lg font-black text-[#0084ff]">{matchedCount}/{totalKeywords}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Match Rate</p>
                            <p className="text-lg font-black text-[#0084ff]">{matchRate}%</p>
                          </div>
                        </div>
                      </div>

                      {/* CARD 2: Skills Analysis Card */}
                      <div className="bg-white border border-[#e2e8f0] rounded-3xl p-6 shadow-[0_4px_20px_-2px_rgba(99,102,241,0.02)] flex flex-col gap-6">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Skills Analysis</span>
                        
                        {/* Side-by-side count cards */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-[#e0f2fe]/45 border border-[#bae6fd]/30 rounded-2xl p-4 text-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Matched Skills</span>
                            <span className="text-3xl font-extrabold text-[#0084ff]">{matchedCount}</span>
                          </div>
                          <div className="bg-rose-50/50 border border-rose-100/50 rounded-2xl p-4 text-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Skills to Develop</span>
                            <span className="text-3xl font-extrabold text-rose-500">{missingCount}</span>
                          </div>
                        </div>

                        {/* Skills You Have section */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#0084ff]"></span> Skills You Have
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {analysisResults.matchedKeywords.length > 0 ? (
                              analysisResults.matchedKeywords.map((skill, i) => (
                                <span 
                                  key={i} 
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#e0f2fe]/50 text-[#0084ff] border border-[#bae6fd]/30 shadow-sm"
                                >
                                  <Check size={12} className="stroke-[3px]" /> {skill}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">No matching technical skills identified.</span>
                            )}
                          </div>
                        </div>

                        {/* Skills to Develop section */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Skills to Develop
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {analysisResults.missingKeywords.length > 0 ? (
                              analysisResults.missingKeywords.map((skill, i) => (
                                <span 
                                  key={i} 
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-500 border border-rose-100/50 shadow-sm"
                                >
                                  <X size={12} className="stroke-[3px]" /> {skill}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-emerald-600 font-bold">You match all parameters perfectly!</span>
                            )}
                          </div>
                        </div>

                      </div>

                    </div>
                  );
                })()
              )}
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
};

export default ProximityAnalyzer;
