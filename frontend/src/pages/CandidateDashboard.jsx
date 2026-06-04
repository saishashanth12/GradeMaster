import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  Target, 
  Brain, 
  CheckCircle2, 
  ChevronRight, 
  TrendingUp, 
  Zap, 
  MapPin, 
  AlertTriangle, 
  Check, 
  X, 
  GraduationCap, 
  Award,
  BookOpen,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

// Semi-circular or circular Readiness Gauge
const ReadinessGauge = ({ percentage }) => {
  const radius = 80;
  const stroke = 14;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center py-6">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          stroke="#f1f5f9"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="#0084ff"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-1000 ease-in-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center mt-2">
        <span className="text-4xl font-black text-[#0084ff] tracking-tight">{percentage}%</span>
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Readiness</span>
      </div>
    </div>
  );
};

const ProgressBar = ({ label, percentage, icon: Icon, colorClass = "bg-[#0084ff]" }) => (
  <div className="mb-6">
    <div className="flex justify-between items-center text-sm mb-2">
      <span className="font-semibold text-slate-600 flex items-center gap-1.5">
        {Icon && <Icon size={16} className="text-slate-400" />}
        {label}
      </span>
      <span className="font-bold text-slate-800">{percentage}%</span>
    </div>
    <div className="w-full bg-[#f1f5f9] rounded-full h-3 overflow-hidden">
      <div
        className={`${colorClass} h-full rounded-full transition-all duration-1000 ease-in-out`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  </div>
);

const CompanyLogo = ({ companyName }) => {
  const name = companyName ? companyName.toLowerCase() : '';
  if (name.includes('google')) {
    return (
      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
        <div className="w-5 h-5 bg-[#4285F4] rotate-45 rounded-sm"></div>
      </div>
    );
  }
  if (name.includes('microsoft')) {
    return (
      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100">
        <div className="w-5 h-5 bg-[#4b70db] rounded-sm"></div>
      </div>
    );
  }
  if (name.includes('amazon')) {
    return (
      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-50 border border-amber-100">
        <div className="w-5 h-5 bg-[#ff9900] rounded-sm"></div>
      </div>
    );
  }
  return (
    <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 font-bold uppercase">
      {companyName ? companyName.charAt(0) : 'J'}
    </div>
  );
};

const CandidateDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    readiness_gauge: 0,
    metrics: { academics: 0, technical: 0, certifications: 0 },
    extracted_tech_stack: [],
    general_competencies: [],
    history_logs: [],
    upcoming_events: []
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ initials: 'U', firstName: 'User' });
  const [activeAnalysisDetail, setActiveAnalysisDetail] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('gm_token');
        if (!token) {
          navigate('/login');
          return;
        }

        const userStr = localStorage.getItem('user');
        if (userStr) {
          const parsedUser = JSON.parse(userStr);
          if (parsedUser.full_name) {
            const parts = parsedUser.full_name.split(' ');
            const initials = parts.map(n => n[0]).join('').toUpperCase().substring(0, 2);
            const firstName = parts[0];
            setUser({ initials, firstName });
          }
        }

        const response = await axios.get('/api/intelligence/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setDashboardData(response.data);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        if (error.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  const formatEventDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafbfc]">
        <div className="w-8 h-8 border-4 border-[#0084ff] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] font-['Inter'] text-gray-800 relative">
      {/* Header & Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-10">
        
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[var(--color-primary-navy)] mb-2 tracking-tight">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-gray-500 text-sm">Review your live academic readiness analytics and match logs below.</p>
        </div>

        {/* High Density Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COMPONENT BLOCK: Profile & Extracted DNA */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Card 1: Holistic Readiness Index Card */}
            <div className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_-2px_rgba(99,102,241,0.02)] border border-slate-100 flex flex-col h-auto">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={20} className="text-[#0084ff]" />
                <h2 className="text-lg font-bold text-[var(--color-primary-navy)] uppercase tracking-wide">
                  Holistic Readiness Index
                </h2>
              </div>
              
              <ReadinessGauge percentage={dashboardData.readiness_gauge} />

              {/* System Recommendation Engine */}
              {(() => {
                const score = dashboardData.readiness_gauge;
                let bgClass = '';
                let textClass = '';
                let borderClass = '';
                let recommendationText = '';
                
                if (score >= 85) {
                  bgClass = 'bg-emerald-50/50';
                  textClass = 'text-emerald-700';
                  borderClass = 'border-emerald-100';
                  recommendationText = 'Outstanding tier availability. Your technical DNA heavily intersects with premium campus benchmarks.';
                } else if (score >= 60) {
                  bgClass = 'bg-amber-50/50';
                  textClass = 'text-amber-700';
                  borderClass = 'border-amber-100';
                  recommendationText = 'Competitive aggregate. Minor technical gaps flagged; resolve pending core parameters to bridge.';
                } else {
                  bgClass = 'bg-rose-50/50';
                  textClass = 'text-rose-700';
                  borderClass = 'border-rose-100';
                  recommendationText = 'Critical preparation required. Focus heavily on project portfolio seeding and missing core taxonomy.';
                }

                return (
                  <div className={`p-4 rounded-2xl border ${bgClass} ${textClass} ${borderClass} text-xs font-semibold leading-relaxed mt-2 mb-4 transition-all duration-300`}>
                    <p className="font-extrabold uppercase tracking-wider text-[9px] opacity-75 mb-1">System Recommendation Engine</p>
                    {recommendationText}
                  </div>
                );
              })()}
              
              <div className="mt-4 border-t border-slate-100 pt-6">
                <ProgressBar 
                  label="Academics" 
                  percentage={dashboardData.metrics.academics} 
                  icon={GraduationCap} 
                  colorClass="bg-[#0084ff]" 
                />
                <ProgressBar 
                  label="Technical Capabilities" 
                  percentage={dashboardData.metrics.technical} 
                  icon={BookOpen} 
                  colorClass="bg-[#38bdf8]" 
                />
                <ProgressBar 
                  label="Certifications" 
                  percentage={dashboardData.metrics.certifications} 
                  icon={Award} 
                  colorClass="bg-amber-400" 
                />
              </div>
            </div>

            {/* Card 2: Extracted Technical Stack Card */}
            <div className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_-2px_rgba(99,102,241,0.02)] border border-slate-100 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <Brain size={20} className="text-[#0084ff]" />
                <h2 className="text-lg font-bold text-[var(--color-primary-navy)] uppercase tracking-wide">
                  Extracted Technical DNA
                </h2>
              </div>

              {/* Flex-wrap tag map */}
              <div className="flex flex-wrap gap-2.5 mb-6">
                {dashboardData.extracted_tech_stack && dashboardData.extracted_tech_stack.length > 0 ? (
                  dashboardData.extracted_tech_stack.map((skill, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#e0f2fe]/65 text-[#0084ff] border border-[#bae6fd]/30 shadow-sm transition-transform hover:scale-[1.03]"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No engineering credentials extracted. Upload your resume to populate.</span>
                )}
              </div>

              <div className="border-t border-slate-100 pt-6 mt-auto">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Filtered General Competencies
                </p>
                <div className="flex flex-wrap gap-2 opacity-75">
                  {dashboardData.general_competencies && dashboardData.general_competencies.length > 0 ? (
                    dashboardData.general_competencies.map((comp, index) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 text-slate-500 border border-slate-200/50"
                      >
                        {comp}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">None</span>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COMPONENT BLOCK: Scrollable Proximity History & Upcoming events */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Proximity History Column */}
            <div className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_-2px_rgba(99,102,241,0.02)] border border-slate-100 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Target size={20} className="text-[#0084ff]" />
                  <h2 className="text-lg font-bold text-[var(--color-primary-navy)] uppercase tracking-wide">
                    Proximity History
                  </h2>
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {dashboardData.history_logs?.length || 0} Runs
                </span>
              </div>

              {/* Scrollable Column Container */}
              <div className="h-[400px] overflow-y-auto pr-2 space-y-4 scrollbar-thin">
                {dashboardData.history_logs && dashboardData.history_logs.length > 0 ? (
                  dashboardData.history_logs.map((log, index) => (
                    <div 
                      key={index} 
                      onClick={() => setActiveAnalysisDetail(log)}
                      className="group p-5 rounded-2xl border border-[#e2e8f0]/60 bg-white hover:border-[#bae6fd] hover:bg-[#e0f2fe]/10 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <CompanyLogo companyName={log.company_name} />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-[var(--color-primary-navy)] text-base">
                              {log.company_name}
                            </h3>
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                              <MapPin size={10} /> {log.location}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-500 mt-0.5">{log.job_role || log.role_title}</p>
                          
                          {/* Cutoff Warning Tag */}
                          <div className="mt-2.5 flex items-center">
                            {log.is_below_cutoff ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-500 border border-rose-100/50 shadow-sm">
                                <AlertTriangle size={12} /> Below GPA Cutoff (Min {log.min_gpa_cutoff}%)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100/50 shadow-sm">
                                <CheckCircle2 size={12} /> Meets Cutoff (Min {log.min_gpa_cutoff}%)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-50">
                        <div className="text-left sm:text-right">
                          <div className="text-[#0084ff] text-xl font-black tracking-tight">{log.proximity_score}%</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Match Score</div>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-[#0084ff] group-hover:text-white transition-all text-slate-400">
                          <ChevronRight size={18} className="stroke-[2.5px]" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-sm font-medium text-slate-500">No proximity analysis history found.</p>
                    <button 
                      onClick={() => navigate('/proximity-analyzer')}
                      className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[#0084ff] hover:bg-[#0070d9] text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                    >
                      Run Proximity Analyzer
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Campus Tracks Card */}
            <div className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_-2px_rgba(99,102,241,0.02)] border border-slate-100 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Calendar size={20} className="text-[#0084ff]" />
                  <h2 className="text-lg font-bold text-[var(--color-primary-navy)] uppercase tracking-wide">
                    Upcoming Campus Tracks
                  </h2>
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">This Week</span>
              </div>

              <div className="space-y-4">
                {dashboardData.upcoming_events && dashboardData.upcoming_events.length > 0 ? (
                  dashboardData.upcoming_events.map((event, index) => {
                    let typeLabel = '[Drill]';
                    let typeBadgeClass = 'bg-[#e0f2fe] text-[#0084ff] border-[#bae6fd]';
                    if (event.event_type === 'aptitude') {
                      typeLabel = '[Aptitude]';
                      typeBadgeClass = 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]';
                    } else if (event.event_type === 'placement') {
                      typeLabel = '[Placement]';
                      typeBadgeClass = 'bg-[#fee2e2] text-[#b91c1c] border-[#fecaca]';
                    }

                    return (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-4 rounded-2xl border border-[#e2e8f0]/60 bg-white hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex flex-col gap-0.5">
                          <p className="font-extrabold text-[var(--color-primary-navy)] text-sm">{event.title}</p>
                          <p className="text-xs text-slate-400 font-semibold">{event.company_name || 'Nexus Preparation'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-extrabold uppercase tracking-wide ${typeBadgeClass}`}>
                            {typeLabel}
                          </span>
                          <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg">
                            {formatEventDate(event.event_date)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-sm font-medium text-slate-500">No events scheduled for this week.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Interactive History Modal Drawer Overlay */}
      {activeAnalysisDetail && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 border border-slate-100 animate-in zoom-in-95 duration-200 relative">
            
            {/* Close Button */}
            <button 
              onClick={() => setActiveAnalysisDetail(null)} 
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-50"
            >
              <X size={20} className="stroke-[2.5px]" />
            </button>

            {/* Header */}
            <div className="mb-6 flex items-start gap-4">
              <CompanyLogo companyName={activeAnalysisDetail.company_name} />
              <div>
                <h3 className="text-2xl font-black text-[var(--color-primary-navy)] tracking-tight">
                  {activeAnalysisDetail.company_name}
                </h3>
                <p className="text-sm font-bold text-[#0084ff] mt-0.5">{activeAnalysisDetail.role_title}</p>
              </div>
            </div>

            {/* Overall Score */}
            <div className="bg-slate-50 rounded-2xl p-4 mb-6 flex items-center justify-between border border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Proximity Match</span>
                <span className="text-2xl font-black text-[var(--color-primary-navy)]">{activeAnalysisDetail.proximity_score}%</span>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold
                ${activeAnalysisDetail.proximity_score >= 75 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                {activeAnalysisDetail.proximity_score >= 75 ? 'Strong Match' : 'Good Match'}
              </span>
            </div>

            {/* Skill Alignment Snapshot */}
            <div className="space-y-6">
              
              {/* Matched Skills */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0084ff]"></span> Matched Skills
                </h4>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto font-sans">
                  {activeAnalysisDetail.matched_keywords && activeAnalysisDetail.matched_keywords.length > 0 ? (
                    activeAnalysisDetail.matched_keywords.map((skill, i) => (
                      <span 
                        key={i} 
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#e0f2fe]/50 text-[#0084ff] border border-[#bae6fd]/30 shadow-sm"
                      >
                        <Check size={12} className="stroke-[3px]" /> {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No matching keywords found.</span>
                  )}
                </div>
              </div>

              {/* Skill Gaps */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> Identified Skill Gaps
                </h4>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto font-sans">
                  {activeAnalysisDetail.missing_keywords && activeAnalysisDetail.missing_keywords.length > 0 ? (
                    activeAnalysisDetail.missing_keywords.map((skill, i) => (
                      <span 
                        key={i} 
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-500 border border-rose-100/50 shadow-sm"
                      >
                        <X size={12} className="stroke-[3px]" /> {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-600 font-bold">No skill gaps identified! Perfect match.</span>
                  )}
                </div>
              </div>

            </div>

            {/* Footer Action */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setActiveAnalysisDetail(null)}
                className="px-5 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Close Details
              </button>
              <button 
                onClick={() => {
                  setActiveAnalysisDetail(null);
                  navigate('/proximity-analyzer');
                }}
                className="px-5 py-2.5 bg-[#0084ff] hover:bg-[#0070d9] text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                Re-Analyze
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CandidateDashboard;
