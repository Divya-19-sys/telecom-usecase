import React, { useState, useEffect, useRef } from 'react';
import { Incident, UserRole, IncidentStatus, USER_ROLES, INCIDENT_STATUSES } from '../types';
import { X, Check, ChevronDown, Sparkles, Building, AlertCircle } from 'lucide-react';

interface IncidentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newIncident: Omit<Incident, 'id' | 'createdAt' | 'lastUpdated' | 'workNotes'>) => void;
}

export function IncidentForm({ isOpen, onClose, onSubmit }: IncidentFormProps) {
  // Field States
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [mailAddress, setMailAddress] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<IncidentStatus>('Open');

  // Multi-select dropdown state
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Validation States
  const [errors, setErrors] = useState<{
    name?: string;
    employeeId?: string;
    mailAddress?: string;
    roles?: string;
    description?: string;
  }>({});

  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Handle outside click to close role dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Soft reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmployeeId('');
      setMailAddress('');
      setSelectedRoles([]);
      setDescription('');
      setStatus('Open');
      setErrors({});
      setHasAttemptedSubmit(false);
    }
  }, [isOpen]);

  const toggleRole = (role: UserRole) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role) 
        : [...prev, role]
    );
  };

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Employee Name is required';
    }
    
    if (!employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required';
    } else if (!/^EMP\d{3,6}$/i.test(employeeId.trim()) && !/^\d{2,8}$/.test(employeeId.trim())) {
      newErrors.employeeId = 'Format: EMP followed by digits or a numeric ID (e.g. EMP8291)';
    }

    if (!mailAddress.trim()) {
      newErrors.mailAddress = 'Email Address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mailAddress)) {
      newErrors.mailAddress = 'Enter a valid corporate email address';
    }

    if (selectedRoles.length === 0) {
      newErrors.roles = 'Please choose at least one functional profile role';
    }

    // MANDATORY FIELD
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.length < 5) {
      newErrors.description = 'Description should be at least 5 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Live validator on change once user hits submit
  useEffect(() => {
    if (hasAttemptedSubmit) {
      validate();
    }
  }, [name, employeeId, mailAddress, selectedRoles, description, hasAttemptedSubmit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    if (validate()) {
      onSubmit({
        name: name.trim(),
        employeeId: employeeId.trim().toUpperCase(),
        mailAddress: mailAddress.trim().toLowerCase(),
        roles: selectedRoles,
        description: description.trim(),
        status
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-[#1e293b]/50 backdrop-blur-md font-sans">
      <div 
        id="create-incident-modal"
        className="relative glass-modal w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Modal Header (ServiceNow Classic Banner Style) */}
        <div className="bg-[#293e40] text-white px-6 py-4 flex items-center justify-between border-b border-white/20 select-none">
          <div className="flex items-center gap-3">
            <div className="bg-[#005fb8] p-1.5 rounded text-white flex items-center justify-center shadow-xs">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Create New Incident</h2>
              <p className="text-[11px] text-slate-300 font-mono">ServiceNow NextExperience Portal</p>
            </div>
          </div>
          <button 
            id="close-modal-header-btn"
            onClick={onClose} 
            className="text-slate-300 hover:text-white transition-colors cursor-pointer p-1 hover:bg-white/10 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5" noValidate>
          
          {/* Section 1: User Demographics */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-1 border-b border-white/40">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-650 bg-white/50 border border-white/70 px-2 py-0.5 rounded">
                Section 01
              </span>
              <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wide">
                User & Role Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Employee ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employee ID <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-employee-id"
                  type="text"
                  placeholder="e.g. EMP8291"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className={`w-full text-sm px-3 py-2 bg-white/80 rounded border outline-hidden transition-all placeholder:text-slate-400 ${
                    errors.employeeId 
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20' 
                      : 'border-slate-300 focus:border-[#005fb8] focus:ring-1 focus:ring-[#005fb8]/20'
                  }`}
                />
                {errors.employeeId && (
                  <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.employeeId}
                  </p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-705 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-full-name"
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full text-sm px-3 py-2 bg-white/80 rounded border outline-hidden transition-all placeholder:text-slate-400 ${
                    errors.name 
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20' 
                      : 'border-slate-300 focus:border-[#005fb8] focus:ring-1 focus:ring-[#005fb8]/20'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-705 mb-1">
                  Mail Address <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-mail-address"
                  type="email"
                  placeholder="e.g. sarah.jenkins@enterprise.com"
                  value={mailAddress}
                  onChange={(e) => setMailAddress(e.target.value)}
                  className={`w-full text-sm px-3 py-2 bg-white/80 rounded border outline-hidden transition-all placeholder:text-slate-400 ${
                    errors.mailAddress 
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20' 
                      : 'border-slate-300 focus:border-[#005fb8] focus:ring-1 focus:ring-[#005fb8]/20'
                  }`}
                />
                {errors.mailAddress && (
                  <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.mailAddress}
                  </p>
                )}
              </div>

              {/* Role Multi-select Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-semibold text-slate-705 mb-1">
                  Profile Roles <span className="text-rose-500">*</span>
                </label>
                
                <button
                  id="btn-role-multiselect-trigger"
                  type="button"
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className={`w-full text-left text-sm px-3 py-2 bg-white/80 rounded border outline-hidden transition-all flex items-center justify-between cursor-pointer ${
                    errors.roles 
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20' 
                      : 'border-slate-300 focus:border-[#005fb8] focus:ring-1 focus:ring-[#005fb8]/20'
                  }`}
                >
                  <div className="flex flex-wrap gap-1 items-center max-w-[90%] overflow-hidden truncate">
                    {selectedRoles.length === 0 ? (
                      <span className="text-slate-400 font-medium">Select roles...</span>
                    ) : (
                      selectedRoles.map(role => (
                        <span 
                          key={role} 
                          className="bg-slate-200/60 border border-slate-300 text-slate-800 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRole(role);
                          }}
                        >
                          {role}
                          <span className="text-slate-400 hover:text-slate-800">&times;</span>
                        </span>
                      ))
                    )}
                  </div>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isRoleDropdownOpen && (
                  <div 
                    id="role-dropdown-panel"
                    className="absolute left-0 right-0 mt-1 z-30 bg-white border border-slate-200 rounded-lg shadow-xl divide-y divide-slate-150 overflow-hidden"
                  >
                    <div className="bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                      Select target profile roles
                    </div>
                    {USER_ROLES.map((role) => {
                      const isChecked = selectedRoles.includes(role);
                      return (
                        <button
                          key={role}
                          id={`role-opt-${role.toLowerCase().replace(' ', '-')}`}
                          type="button"
                          onClick={() => toggleRole(role)}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer text-sm font-medium"
                        >
                          <span className={`${isChecked ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                            {role}
                          </span>
                          {isChecked ? (
                            <div className="bg-sky-100 p-0.5 rounded text-sky-700">
                              <Check className="h-4.5 w-4.5 stroke-[3px]" />
                            </div>
                          ) : (
                            <div className="h-4.5 w-4.5 rounded border border-slate-300 bg-white" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                {errors.roles && (
                  <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3 w-3 shrink-0" /> {errors.roles}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Technical/Incident Details */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-1 border-b border-white/40">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-650 bg-white/50 border border-white/70 px-2 py-0.5 rounded">
                Section 02
              </span>
              <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wide">
                Incident & Ticket Classification
              </h3>
            </div>

            <div className="space-y-4">
              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-707 mb-1">
                  Description <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-description"
                  type="text"
                  placeholder="e.g. Blank page loading upon Workday portal login redirect"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full text-sm px-3 py-2 bg-white/80 rounded border outline-hidden transition-all placeholder:text-slate-400 ${
                    errors.description 
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20' 
                      : 'border-slate-300 focus:border-[#005fb8] focus:ring-1 focus:ring-[#005fb8]/20'
                  }`}
                />
                {errors.description && (
                  <p className="mt-1 text-[11px] text-rose-550 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errors.description}
                  </p>
                )}
              </div>

              {/* Initial Status Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-707 mb-1">
                  Initial Status
                </label>
                <select
                  id="select-incident-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as IncidentStatus)}
                  className="w-full text-sm px-3 py-2 bg-white/80 rounded border border-slate-300 focus:border-[#005fb8] focus:ring-1 focus:ring-[#005fb8]/20 cursor-pointer outline-hidden font-medium text-slate-800"
                >
                  {INCIDENT_STATUSES.map((stat) => (
                    <option key={stat} value={stat}>
                      {stat}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  * Note: Re-submitting default status allocates status: <strong>{status}</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Dialog Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/40">
            <button
               id="btn-cancel-incident"
               type="button"
               onClick={onClose}
               className="px-4 py-2 text-xs font-bold text-slate-700 bg-white/50 border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-incident-btn"
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#005fb8] hover:bg-[#004f99] active:scale-[0.98] rounded-lg shadow-md font-sans flex items-center gap-1.5 transition-all hover:shadow-lg cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Submit Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
