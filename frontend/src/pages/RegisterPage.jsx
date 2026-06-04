import React, { useState } from 'react';
import { Target, Upload } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = '/api/auth';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    techStack: '',
    experience: '0-1 years (Fresher)',
    internshipHistory: '',
    resumeFile: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData((prev) => ({ ...prev, resumeFile: e.target.files[0] }));
    }
  };

  // Step Handlers & API Calls
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/register-step-1`, {
        full_name: formData.fullName,
        email: formData.email,
        password: formData.password
      });
      // Save token
      localStorage.setItem('gm_token', response.data.token);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('gm_token');
      // Parse tech stack into array
      const techArray = formData.techStack.split(',').map(s => s.trim()).filter(s => s);

      await axios.post(`${API_BASE_URL}/register-step-2`, {
        tech_stack: techArray,
        experience_level: formData.experience,
        project_history: formData.internshipHistory
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update technical profile');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Submit = async (e) => {
    e.preventDefault();
    if (!formData.resumeFile) {
      setError('Please upload a resume first.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('gm_token');
      const fd = new FormData();
      fd.append('resume', formData.resumeFile);

      await axios.post(`${API_BASE_URL}/register-step-3`, fd, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Complete!
      navigate('/dashboard'); 
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process resume');
    } finally {
      setLoading(false);
    }
  };

  // UI Components
  const renderProgressBar = () => {
    const percentages = { 1: '33%', 2: '67%', 3: '100%' };
    const width = percentages[step];
    return (
      <div className="mb-8">
        <div className="flex justify-between text-xs font-medium text-gray-500 mb-2 font-inter">
          <span>Step {step} of 3</span>
          <span>{width}</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#0084ff] transition-all duration-300 ease-in-out" 
            style={{ width }} 
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col pt-8 pb-12" style={{ backgroundColor: '#f0f7ff' }}>
      
      {/* Header / Logo */}
      <div className="flex justify-center mb-10">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-[var(--color-primary-navy)] p-1.5 rounded-md">
            <Target size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[var(--color-primary-navy)] font-outfit">
            GradeMaster
          </span>
        </Link>
      </div>

      {/* Main Registration Card */}
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-10 p-6">
        
        {renderProgressBar()}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {/* --- STEP 1 UI --- */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[var(--color-primary-navy)] font-outfit mb-2">Create Your Account</h1>
              <p className="text-sm text-gray-500 font-inter">Let's get you started with GradeMaster</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[var(--color-primary-navy)] mb-1.5 font-inter">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-[#0084ff] focus:ring-1 focus:ring-[#0084ff] outline-none transition-all placeholder:text-gray-400 font-inter"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[var(--color-primary-navy)] mb-1.5 font-inter">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-[#0084ff] focus:ring-1 focus:ring-[#0084ff] outline-none transition-all placeholder:text-gray-400 font-inter"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--color-primary-navy)] mb-1.5 font-inter">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a secure password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-[#0084ff] focus:ring-1 focus:ring-[#0084ff] outline-none transition-all placeholder:text-gray-400 font-inter"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 bg-[#0084ff] text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed font-inter"
              >
                {loading ? 'Processing...' : 'Continue'}
              </button>
            </div>
          </form>
        )}

        {/* --- STEP 2 UI --- */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[var(--color-primary-navy)] font-outfit mb-2">Your Technical Profile</h1>
              <p className="text-sm text-gray-500 font-inter">Help us understand your skills and experience</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[var(--color-primary-navy)] mb-1.5 font-inter">Technical Stack</label>
                <input
                  type="text"
                  name="techStack"
                  value={formData.techStack}
                  onChange={handleInputChange}
                  placeholder="e.g., React, Python, Node.js"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-[#0084ff] focus:ring-1 focus:ring-[#0084ff] outline-none transition-all placeholder:text-gray-400 font-inter"
                />
                <p className="text-[11px] text-gray-400 mt-1.5 ml-1 font-inter">Separate skills with commas</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[var(--color-primary-navy)] mb-1.5 font-inter">Years of Experience</label>
                <select
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-[#0084ff] focus:ring-1 focus:ring-[#0084ff] outline-none transition-all text-gray-700 font-inter bg-white"
                >
                  <option value="0-1 years (Fresher)">0-1 years (Fresher)</option>
                  <option value="1-3 years">1-3 years</option>
                  <option value="3-5 years">3-5 years</option>
                  <option value="5+ years">5+ years</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--color-primary-navy)] mb-1.5 font-inter">Internship History</label>
                <textarea
                  name="internshipHistory"
                  value={formData.internshipHistory}
                  onChange={handleInputChange}
                  placeholder="Briefly describe your internships or projects"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-[#0084ff] focus:ring-1 focus:ring-[#0084ff] outline-none transition-all placeholder:text-gray-400 font-inter resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors font-inter text-sm"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-3.5 bg-[#0084ff] text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed font-inter text-sm"
                >
                  {loading ? 'Saving...' : 'Continue'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* --- STEP 3 UI --- */}
        {step === 3 && (
          <form onSubmit={handleStep3Submit} className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[var(--color-primary-navy)] font-outfit mb-2">Upload Your Resume</h1>
              <p className="text-sm text-gray-500 font-inter">We'll analyze your resume for optimal matches</p>
            </div>

            <div className="space-y-6">
              
              {/* File Upload Area */}
              <div className="relative group cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`w-full py-10 px-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all bg-[#f8fbff]
                    ${formData.resumeFile ? 'border-[#0084ff] bg-blue-50' : 'border-blue-200 group-hover:border-[#0084ff] group-hover:bg-blue-50'}`}
                >
                  <div className="bg-white p-3 rounded-full mb-3 shadow-sm border border-blue-100">
                    <Upload size={24} className="text-[#0084ff]" />
                  </div>
                  
                  {formData.resumeFile ? (
                    <div className="text-center">
                      <p className="font-semibold text-sm text-[#0084ff]">{formData.resumeFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1">Ready to upload</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Drop your resume here or <span className="text-[#0084ff]">browse</span>
                      </p>
                      <p className="text-[11px] text-gray-400 font-inter">PDF, DOC, DOCX (Max 5MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-center text-xs text-gray-500 leading-relaxed font-inter px-2">
                Your resume will be analyzed using AI to calculate your hiring readiness score
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/3 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors font-inter text-sm"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.resumeFile}
                  className="w-2/3 py-3.5 bg-[#0084ff] text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed font-inter text-sm"
                >
                  {loading ? 'Processing...' : 'Complete Registration'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Footer Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 font-inter">
            Already have an account? <Link to="/login" className="text-[#0084ff] font-medium hover:underline">Sign In</Link>
          </p>
        </div>

      </div>

    </div>
  );
};

export default RegisterPage;
