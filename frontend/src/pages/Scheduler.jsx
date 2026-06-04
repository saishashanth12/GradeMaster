import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Trash2, Map } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

// Utility for creating calendar days
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const Scheduler = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({ title: '', company: '', type: 'aptitude', date: '', time: '10:00' });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('gm_token');
      if (!token) return navigate('/login');
      
      const response = await axios.get('/api/logistics/events', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(response.data);
    } catch (error) {
      toast.error('Failed to load timeline events');
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  const openAddModal = (day) => {
    const paddedMonth = String(month + 1).padStart(2, '0');
    const paddedDay = String(day).padStart(2, '0');
    setFormData({ title: '', company: '', type: 'aptitude', date: `${year}-${paddedMonth}-${paddedDay}`, time: '10:00' });
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const openEditModal = (e, event) => {
    e.stopPropagation();
    const eventDate = new Date(event.date);
    const timeString = `${String(eventDate.getHours()).padStart(2, '0')}:${String(eventDate.getMinutes()).padStart(2, '0')}`;
    setFormData({
      title: event.title,
      company: event.company,
      type: event.type,
      date: event.date.split('T')[0],
      time: timeString
    });
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('gm_token');
      const payloadDate = new Date(`${formData.date}T${formData.time}`).toISOString();
      const payload = { title: formData.title, company: formData.company, type: formData.type, date: payloadDate };

      if (editingEvent) {
        await axios.put(`/api/logistics/events/${editingEvent.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Event updated!');
      } else {
        await axios.post('/api/logistics/events', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Event scheduled!');
      }
      setIsModalOpen(false);
      fetchEvents();
    } catch (error) {
      toast.error('Failed to save event');
    }
  };

  const handleDelete = async () => {
    if (!editingEvent) return;
    try {
      const token = localStorage.getItem('gm_token');
      await axios.delete(`/api/logistics/events/${editingEvent.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Event removed');
      setIsModalOpen(false);
      fetchEvents();
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  // Build Calendar Grid
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Generate 6 months: April to September 2026 to match design
  const getRoadmapMonths = () => {
    const months = [];
    const start = new Date(2026, 3, 1); // April 2026
    for (let i = 0; i < 6; i++) {
      months.push(new Date(start.getFullYear(), start.getMonth() + i, 1));
    }
    return months;
  };
  const roadmapMonths = getRoadmapMonths();

  // Retrieve first scheduled event in a month
  const getEventForMonth = (m) => {
    const monthEvents = events.filter(ev => {
      const evDate = new Date(ev.date);
      return evDate.getMonth() === m.getMonth() && evDate.getFullYear() === m.getFullYear();
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
    return monthEvents[0] || null;
  };

  // Date ordinal suffix helper
  const getOrdinal = (d) => {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
      case 1:  return "st";
      case 2:  return "nd";
      case 3:  return "rd";
      default: return "th";
    }
  };

  // Helper to format event time consistently (e.g. 10:00am)
  const formatEventTime = (dateStr) => {
    try {
      const d = new Date(dateStr);
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours}:${minutes}${ampm}`;
    } catch (e) {
      return '10:00am';
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] font-['Inter'] text-gray-800">
      {/* Header */}
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[var(--color-primary-navy)] tracking-tight">Nexus Scheduler</h1>
          <p className="text-gray-500 text-sm mt-1">Plan your preparation and track upcoming placement dates</p>
        </div>

        {/* Placement Roadmap Widget */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-2 text-[var(--color-electric-blue)]">
               <Map size={22} />
               <h2 className="text-lg font-semibold text-[var(--color-primary-navy)]">Placement Roadmap</h2>
             </div>
             <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Next 6 Months</span>
          </div>
          
          <div className="relative flex items-center justify-between w-full mt-4 pb-4">
             {/* Background Line */}
             <div className="absolute top-4 left-0 w-full h-0.5 bg-[#f1f5f9] -z-10"></div>
             
             {roadmapMonths.map((m, i) => {
               const ev = getEventForMonth(m);
               const hasEvent = ev !== null;
               const bulletClass = hasEvent 
                 ? "w-8 h-8 rounded-full bg-[#0084ff] border-4 border-white shadow-md mb-2 transition-transform duration-300 hover:scale-110" 
                 : "w-8 h-8 rounded-full bg-blue-100/70 border-4 border-white shadow-sm mb-2";

               return (
                 <div key={i} className="flex flex-col items-center w-24">
                   <div className={bulletClass}></div>
                   <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{m.toLocaleString('default', { month: 'short' })}</span>
                   <div className="h-20 mt-2 flex flex-col justify-start">
                     {hasEvent && (() => {
                       const evDate = new Date(ev.date);
                       const ordinal = getOrdinal(evDate.getDate());
                       return (
                         <div className="mt-1 bg-[#e0f2fe]/50 border border-[#bae6fd]/30 rounded-xl px-3 py-2 text-center shadow-sm max-w-[120px] transition-all hover:bg-[#e0f2fe]/70 hover:scale-[1.03]">
                           <p className="text-xs font-bold text-[var(--color-primary-navy)] truncate">{ev.company || ev.title}</p>
                           <p className="text-[10px] text-[#0084ff] font-extrabold mt-0.5">{evDate.getDate()}{ordinal}</p>
                         </div>
                       );
                     })()}
                   </div>
                 </div>
               );
             })}
          </div>
        </div>

        {/* Monthly Calendar */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-primary-navy)]">{monthName} {year}</h2>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft size={20} className="text-gray-600" /></button>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight size={20} className="text-gray-600" /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-4 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-bold text-gray-400 uppercase">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-3">
            {blanks.map(b => (
              <div key={`blank-${b}`} className="min-h-[120px] rounded-xl border border-transparent bg-transparent"></div>
            ))}
            
            {days.map(day => {
              const currentDayEvents = events.filter(ev => {
                const evDate = new Date(ev.date);
                return evDate.getDate() === day && evDate.getMonth() === month && evDate.getFullYear() === year;
              });

              // Helper for label conversions
              const getTypeLabel = (type) => {
                if (type === 'aptitude') return 'Aptitude';
                if (type === 'placement') return 'Placement';
                return 'Drill/Practice';
              };

              // Helper for custom day cell styling classes (matching design screenshots)
              const getTypeClasses = (type) => {
                if (type === 'aptitude') return 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]';
                if (type === 'placement') return 'bg-[#fee2e2] text-[#b91c1c] border-[#fecaca]';
                return 'bg-[#e0f2fe] text-[#0084ff] border-[#bae6fd]'; // Sky blue for Drill/Practice and fallback types
              };

              return (
                <div 
                  key={day} 
                  onClick={() => openAddModal(day)}
                  className="min-h-[125px] rounded-xl border border-gray-100 bg-white p-2.5 cursor-pointer hover:border-[var(--color-electric-blue)] transition-colors group flex flex-col"
                >
                  <span className="text-sm font-semibold text-slate-400 mb-1.5">{day}</span>
                  <div className="flex flex-col gap-1.5 flex-grow">
                    {currentDayEvents.slice(0, 3).map(ev => {
                      const eventTime = formatEventTime(ev.date);
                      const typeLabel = getTypeLabel(ev.type);
                      const typeClasses = getTypeClasses(ev.type);
                      
                      return (
                        <div 
                          key={ev.id}
                          onClick={(e) => openEditModal(e, ev)}
                          className={`text-[10px] p-2 rounded-xl border font-semibold flex flex-col gap-0.5 transition-all shadow-sm hover:scale-[1.02] ${typeClasses}`}
                        >
                          <div className="font-extrabold truncate leading-tight">{ev.title}</div>
                          <div className="flex items-center gap-1 text-[7.5px] opacity-80 uppercase font-extrabold tracking-wider mt-0.5">
                            <span>{typeLabel}</span>
                            <span>·</span>
                            <span>{eventTime}</span>
                          </div>
                        </div>
                      );
                    })}
                    {currentDayEvents.length > 3 && (
                      <span className="text-[10px] text-gray-400 font-semibold pl-1">+{currentDayEvents.length - 3} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#fcd34d]"></div>
              <span className="text-xs font-semibold text-gray-500">Aptitude Drill</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#fca5a5]"></div>
              <span className="text-xs font-semibold text-gray-500">Placement Date</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#38bdf8]"></div>
              <span className="text-xs font-semibold text-gray-500">Drill/Practice</span>
            </div>
          </div>
        </div>
      </main>

      {/* Add / Edit Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[var(--color-primary-navy)]">{editingEvent ? 'Edit Event' : 'Schedule Event'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--color-electric-blue)] focus:outline-none" placeholder="e.g. Google Online Assessment" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company (Optional)</label>
                <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--color-electric-blue)] focus:outline-none" placeholder="e.g. Google" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--color-electric-blue)] focus:outline-none">
                  <option value="aptitude">Aptitude Drill</option>
                  <option value="placement">Placement Date</option>
                  <option value="drill">Drill/Practice</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--color-electric-blue)] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input required type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--color-electric-blue)] focus:outline-none" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                {editingEvent && (
                  <button type="button" onClick={handleDelete} className="px-4 py-2 flex items-center justify-center border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors">
                    <Trash2 size={18} />
                  </button>
                )}
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-[2] px-4 py-2 bg-[var(--color-electric-blue)] text-white rounded-lg hover:bg-[#0284c7] font-medium transition-colors">
                  {editingEvent ? 'Update Event' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scheduler;
