import React from 'react';
import { Target, Brain, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col relative" style={{ backgroundColor: 'var(--background-white)', color: 'var(--primary-navy)' }}>
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-6 sm:px-12 py-4 shadow-sm" style={{ backgroundColor: 'var(--background-white)', borderBottom: '1px solid var(--border-grey)' }}>
        <Link to="/" className="flex items-center gap-2">
          <Target size={24} style={{ color: 'var(--electric-blue)' }} />
          <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-outfit)', color: 'var(--primary-navy)' }}>GradeMaster</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium hover:text-[#0066ff] transition-colors" style={{ color: 'var(--primary-navy)' }}>Features</a>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-gray-200" style={{ color: 'var(--primary-navy)' }}>
            Login
          </Link>
          <Link to="/register" className="text-sm text-white px-5 py-2 rounded-lg font-medium transition-colors hover:opacity-90 shadow-sm" style={{ backgroundColor: 'var(--electric-blue)' }}>
            Get Started
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col pt-32 px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <section className="w-full max-w-4xl mx-auto text-center mb-20 relative">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6" style={{ fontFamily: 'var(--font-outfit)', color: 'var(--primary-navy)' }}>
            Know your selection probability before you apply
          </h1>
          <p className="max-w-3xl mx-auto text-lg leading-relaxed" style={{ color: '#475569', fontFamily: 'var(--font-inter)' }}>
            GradeMaster uses Predictive Career Intelligence to calculate your mathematical alignment with corporate 
            requirements, transforming job applications into data-backed selection strategies.
          </p>
        </section>

        {/* Feature Grid */}
        <section id="features" className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-24 px-4">
          
          {/* Card 1 */}
          <div className="rounded-2xl p-8 transition-transform hover:-translate-y-2" style={{ backgroundColor: 'var(--background-white)', boxShadow: 'var(--card-shadow)', border: '1px solid var(--border-grey)' }}>
            <Brain size={32} style={{ color: 'var(--electric-blue)', marginBottom: '1.5rem' }} />
            <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'var(--font-outfit)', color: 'var(--primary-navy)' }}>AI Scorer</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#64748b', fontFamily: 'var(--font-inter)' }}>
              Establish your Hiring Readiness baseline. It identifies your strengths and opportunities.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl p-8 transition-transform hover:-translate-y-2" style={{ backgroundColor: 'var(--background-white)', boxShadow: 'var(--card-shadow)', border: '1px solid var(--border-grey)' }}>
            <Target size={32} style={{ color: 'var(--electric-blue)', marginBottom: '1.5rem' }} />
            <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'var(--font-outfit)', color: 'var(--primary-navy)' }}>Proximity Engine</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#64748b', fontFamily: 'var(--font-inter)' }}>
              Calculate Selection Proximity with our JD-alignment with specific corporate requirements.
            </p>
          </div>

        </section>

      </main>

      {/* Closing CTA */}
      <section className="w-full py-20 px-4" style={{ backgroundColor: '#f0f7ff' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-outfit)', color: 'var(--primary-navy)' }}>
            Ready to transform your job search?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: '#475569', fontFamily: 'var(--font-inter)' }}>
            Join thousands of candidates using data-driven insights to land their dream jobs with confidence.
          </p>
          <Link to="/register" className="inline-block px-8 py-4 rounded-lg font-bold text-white transition-opacity hover:opacity-90 shadow-md" style={{ backgroundColor: 'var(--electric-blue)', fontFamily: 'var(--font-inter)' }}>
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
