import React, { useState, useEffect } from 'react';
import { Target, Bell, User, Lock, FileText, Upload } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';

const ProfileSettings = () => {
  const navigate = useNavigate();
  
  const [personalInfo, setPersonalInfo] = useState({
    fullName: 'John Doe',
    email: 'john.doe@example.com'
  });

  const [uploadingResume, setUploadingResume] = useState(false);
  const [currentResumeName, setCurrentResumeName] = useState('No resume uploaded');

  const [passwordInfo, setPasswordInfo] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        if (parsedUser.full_name) {
          setPersonalInfo({
            fullName: parsedUser.full_name,
            email: parsedUser.email || 'john.doe@example.com'
          });
          if (parsedUser.profile && parsedUser.profile.documentData) {
            setCurrentResumeName(parsedUser.profile.documentData.originalName || parsedUser.profile.documentData.filename);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleResumeUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploadingResume(true);
    const toastId = toast.loading('Uploading and analyzing resume...');
    
    try {
      const token = localStorage.getItem('gm_token');
      const fd = new FormData();
      fd.append('resume', file);

      const response = await axios.post('/api/auth/register-step-3', fd, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Resume uploaded successfully!', { id: toastId });
      setCurrentResumeName(file.name);
      
      // Update local storage user profile
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const parsedUser = JSON.parse(userStr);
        if (!parsedUser.profile) parsedUser.profile = {};
        parsedUser.profile.documentData = { originalName: file.name };
        localStorage.setItem('user', JSON.stringify(parsedUser));
      }
      
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to process resume', { id: toastId });
    } finally {
      setUploadingResume(false);
      e.target.value = ''; // reset file input
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (!passwordInfo.currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    if (!passwordInfo.newPassword) {
      toast.error('Please enter a new password.');
      return;
    }
    if (passwordInfo.newPassword !== passwordInfo.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    const toastId = toast.loading('Updating password...');
    try {
      const token = localStorage.getItem('gm_token');
      const response = await axios.post('/api/profile/update-password', {
        currentPassword: passwordInfo.currentPassword,
        newPassword: passwordInfo.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(response.data.message || 'Password updated successfully!', { id: toastId });
      setPasswordInfo({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to update password.', { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] font-['Inter'] text-gray-800">
      {/* Header & Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[var(--color-primary-navy)] tracking-tight">Profile Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Personal Information */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-6 text-[var(--color-electric-blue)]">
                <User size={20} />
                <h2 className="text-lg font-semibold text-[var(--color-primary-navy)]">Personal Information</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-primary-navy)] mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={personalInfo.fullName}
                    onChange={(e) => setPersonalInfo({...personalInfo, fullName: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-blue)]/50 focus:border-[var(--color-electric-blue)] transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-primary-navy)] mb-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    </div>
                    <input 
                      type="email" 
                      value={personalInfo.email}
                      onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                      className="w-full pl-10 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-blue)]/50 focus:border-[var(--color-electric-blue)] transition-all text-sm"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-electric-blue)] text-white rounded-lg font-medium hover:bg-[#0284c7] transition-colors text-sm">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-6 text-[var(--color-electric-blue)]">
                <Lock size={20} />
                <h2 className="text-lg font-semibold text-[var(--color-primary-navy)]">Change Password</h2>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-primary-navy)] mb-1">Current Password</label>
                  <input 
                    type="password" 
                    placeholder="Enter current password"
                    value={passwordInfo.currentPassword}
                    onChange={(e) => setPasswordInfo({...passwordInfo, currentPassword: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-blue)]/50 focus:border-[var(--color-electric-blue)] transition-all text-sm placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-primary-navy)] mb-1">New Password</label>
                  <input 
                    type="password" 
                    placeholder="Enter new password"
                    value={passwordInfo.newPassword}
                    onChange={(e) => setPasswordInfo({...passwordInfo, newPassword: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-blue)]/50 focus:border-[var(--color-electric-blue)] transition-all text-sm placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-primary-navy)] mb-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    placeholder="Confirm new password"
                    value={passwordInfo.confirmPassword}
                    onChange={(e) => setPasswordInfo({...passwordInfo, confirmPassword: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-electric-blue)]/50 focus:border-[var(--color-electric-blue)] transition-all text-sm placeholder:text-gray-400"
                  />
                </div>
                <div className="pt-2">
                  <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-electric-blue)] text-white rounded-lg font-medium hover:bg-[#0284c7] transition-colors text-sm">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                    Update Password
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Resume */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-6 text-[var(--color-electric-blue)]">
                <FileText size={20} />
                <h2 className="text-lg font-semibold text-[var(--color-primary-navy)]">Resume</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Current Resume</h3>
                  <div className="flex items-center gap-4 p-4 bg-[var(--background-white)] border border-gray-100 rounded-xl">
                    <div className="p-2.5 bg-[#e0f2fe] rounded-lg">
                      <FileText size={20} className="text-[var(--color-electric-blue)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-primary-navy)]">{currentResumeName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">PDF Document</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Upload New Resume</h3>
                  <div className={`relative w-full py-8 px-6 border-2 border-dashed border-[#bae6fd] rounded-xl flex flex-col items-center justify-center transition-all ${uploadingResume ? 'bg-blue-50 opacity-70' : 'bg-[#f0f9ff] hover:bg-[#e0f2fe] cursor-pointer group'}`}>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                      disabled={uploadingResume}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                    />
                    <div className="bg-white p-2.5 rounded-full mb-3 shadow-sm border border-[#e0f2fe]">
                      {uploadingResume ? (
                        <div className="w-5 h-5 border-2 border-[var(--color-electric-blue)] border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Upload size={20} className="text-[var(--color-electric-blue)]" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-[var(--color-primary-navy)] mb-1">
                        {uploadingResume ? 'Processing document...' : <><span className="text-[var(--color-electric-blue)]">Browse files</span> or drag here</>}
                      </p>
                      <p className="text-xs text-gray-500">PDF, DOC, DOCX (Max 5MB)</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Account Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Member Since</span>
                      <span className="font-medium text-[var(--color-primary-navy)]">Jan 2026</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Applications</span>
                      <span className="font-medium text-[var(--color-primary-navy)]">24</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Interviews</span>
                      <span className="font-medium text-[var(--color-primary-navy)]">8</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileSettings;
