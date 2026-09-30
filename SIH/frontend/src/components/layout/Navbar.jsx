/**
 * @module components/layout/Navbar
 * @description Responsive top navigation header bar with location & language selector.
 */
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getLocalFallbackBlocks } from '../../services/api';
import {
  CloudRain,
  MapPin,
  Sprout,
  ShieldCheck,
  Bell,
  ChevronRight,
  Activity,
  User,
  LogOut,
  LogIn,
  Search,
  Menu,
  X,
  Navigation
} from 'lucide-react';

export const Navbar = () => {
  const { 
    activeTab, 
    setActiveTab, 
    farmerLanguage, 
    setFarmerLanguage,
    user,
    isLoggedIn,
    logoutUserSession,
    selectedState,
    districts,
    selectedDistrict,
    blocks,
    selectedBlock,
    selectedPanchayat,
    setSelectedPanchayat,
    changeLocation,
    detectRealTimeLocation,
    detectingLocation,
    locationStatus,
    loadingForecast,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    notificationsList = [],
    markAllNotificationsRead,
    removeNotification,
    clearAllNotifications,
    triggerTestNotification,
    unreadNotificationCount = 0
  } = useApp();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  const handleDistrictChange = (e) => {
    const newDistrict = e.target.value;
    const fallbackBlocks = getLocalFallbackBlocks(newDistrict);
    const firstB = fallbackBlocks?.[0];
    changeLocation(newDistrict, firstB?.block, firstB?.id, firstB?.panchayats?.[0]);
  };

  const handleBlockChange = (e) => {
    const bname = e.target.value;
    const found = (blocks || []).find(b => b.block === bname);
    if (found) {
      changeLocation(found.district || selectedDistrict, found.block, found.id, found.panchayats?.[0]);
    } else {
      changeLocation(selectedDistrict, bname, null, null);
    }
  };

  const handlePanchayatChange = (e) => {
    const gp = e.target.value;
    // GP change also re-fetches real-time forecast (via AppContext effect) + stores + broadcasts
    setSelectedPanchayat(gp);
  };

  const currentBlockObj = (blocks || []).find(b => b.block === selectedBlock);
  const basePanchayats = currentBlockObj?.panchayats || [];
  // Always show ALL GPs of selected block; keep selected on top if stale
  const activePanchayats = selectedPanchayat && basePanchayats.length > 0 && !basePanchayats.includes(selectedPanchayat)
    ? [selectedPanchayat, ...basePanchayats]
    : basePanchayats;

  const districtCount = districts?.length || 0;
  const blockCount = blocks?.length || 0;
  const gpCount = activePanchayats?.length || 0;

  const [navSearch, setNavSearch] = useState('');
  const [navSearching, setNavSearching] = useState(false);

  const handleNavSearch = async (e) => {
    e?.preventDefault();
    const query = navSearch.trim();
    if (!query) return;

    setNavSearching(true);
    try {
      let districtName = '';
      let blockName = '';
      let locationName = query;
      const isPincode = /^\d{6}$/.test(query);

      if (isPincode) {
        try {
          const pinRes = await fetch(`https://api.postalpincode.in/pincode/${query}`);
          const pinData = await pinRes.json();
          if (pinData[0]?.Status === 'Success' && pinData[0]?.PostOffice?.length) {
            const mainPo = pinData[0].PostOffice[0];
            districtName = mainPo.District;
            blockName = mainPo.Block || mainPo.Name;
            locationName = mainPo.Name;
          }
        } catch (e) { }
      } else {
        try {
          const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`);
          const nomData = await nomRes.json();
          if (nomData && nomData.length) {
            const item = nomData[0];
            const addr = item.address || {};
            const district = addr.state_district || addr.district || addr.county || addr.city_district || addr.city || '';
            districtName = district.replace(/ district/i, '').trim();
            blockName = addr.suburb || addr.town || addr.village || addr.city || query;
            locationName = addr.village || addr.suburb || addr.town || item.name || query;
          }
        } catch (e) { }
      }

      changeLocation(districtName || selectedDistrict, blockName || selectedBlock, null, locationName);
      setNavSearch('');
    } catch (err) {
      console.warn("Nav search error", err);
    }
    setNavSearching(false);
  };

  const renderLocationSelects = (isMobile = false) => (
    <div className={`items-center gap-1 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded-xl text-xs shadow-inner min-w-0 shrink overflow-hidden ${isMobile ? 'flex flex-wrap gap-1.5' : 'hidden xl:flex'}`}>
      <div className="flex items-center gap-1 text-slate-400 shrink-0">
        <MapPin className="h-3.5 w-3.5 text-sky-400" />
        <span className="font-semibold text-slate-300 hidden 2xl:inline">{selectedState}</span>
        <ChevronRight className="h-3 w-3 text-slate-600 hidden 2xl:inline" />
      </div>

      {/* District Dropdown — shows ALL districts */}
      <select
        value={selectedDistrict || ''}
        onChange={handleDistrictChange}
        title={`${districtCount} districts available`}
        className="bg-slate-800/80 hover:bg-slate-800 text-sky-300 font-semibold rounded-lg px-1.5 py-1 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-400 cursor-pointer max-w-[95px] 2xl:max-w-[130px] shrink truncate text-[11px]"
      >
        {districtCount === 0 && <option value="">Loading…</option>}
        {selectedDistrict && districts && !districts.includes(selectedDistrict) && (
          <option value={selectedDistrict} className="bg-slate-900 text-white font-bold">
            {selectedDistrict}
          </option>
        )}
        {(districts || []).map(d => (
          <option key={d} value={d} className="bg-slate-900 text-white">
            {d}
          </option>
        ))}
      </select>

      <ChevronRight className="h-3 w-3 text-slate-600 shrink-0" />

      {/* Block Dropdown — shows ALL blocks of selected district */}
      <select
        value={selectedBlock || ''}
        onChange={handleBlockChange}
        title={`${blockCount} blocks in ${selectedDistrict}`}
        className="bg-slate-800/80 hover:bg-slate-800 text-amber-300 font-bold rounded-lg px-1.5 py-1 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer max-w-[105px] 2xl:max-w-[140px] shrink truncate text-[11px]"
      >
        {blockCount === 0 && <option value="">No blocks</option>}
        {selectedBlock && blocks && !blocks.some(b => b.block === selectedBlock) && (
          <option value={selectedBlock} className="bg-slate-900 text-white font-bold">
            {selectedBlock}
          </option>
        )}
        {(blocks || []).map(b => (
          <option key={b.id || b.block} value={b.block} className="bg-slate-900 text-white">
            {b.block} ({b.panchayats?.length || 0} GPs)
          </option>
        ))}
      </select>

      <ChevronRight className="h-3 w-3 text-slate-600 shrink-0" />

      {/* Panchayat / GP Dropdown — shows ALL GPs of selected block */}
      <select
        value={selectedPanchayat || ''}
        onChange={handlePanchayatChange}
        title={`${gpCount} GPs in ${selectedBlock}`}
        className="bg-slate-800/80 hover:bg-slate-800 text-emerald-300 font-medium rounded-lg px-1.5 py-1 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer max-w-[95px] 2xl:max-w-[130px] shrink truncate text-[11px]"
      >
        {gpCount === 0 && <option value="">No GPs</option>}
        {activePanchayats.map(p => (
          <option key={p} value={p} className="bg-slate-900 text-white">
            GP: {p}
          </option>
        ))}
      </select>

      {/* Place / GP / Pincode Universal Search Input */}
      <form onSubmit={handleNavSearch} className="flex items-center gap-1 bg-slate-800/90 border border-slate-700 rounded-lg px-1.5 py-1 shrink-0">
        <Search className="h-3 w-3 text-cyan-400 shrink-0" />
        <input
          type="text"
          value={navSearch}
          onChange={(e) => setNavSearch(e.target.value)}
          placeholder="Search Place/GP/PIN..."
          className="w-20 2xl:w-28 bg-transparent text-[11px] text-white placeholder-slate-400 focus:outline-none font-medium"
        />
        <button type="submit" disabled={navSearching} className="text-[10px] bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-1.5 py-0.5 rounded cursor-pointer">
          {navSearching ? '...' : 'Go'}
        </button>
      </form>

      {/* Real-Time GPS Auto-Detect Button */}
      <button
        type="button"
        onClick={detectRealTimeLocation}
        disabled={detectingLocation}
        title={locationStatus || "Detect Real-Time GPS / IP Location"}
        className="flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black px-2 py-1 rounded-lg text-[10px] shadow transition-all cursor-pointer disabled:opacity-50 shrink-0 border border-emerald-400/40"
      >
        <Navigation className={`h-3 w-3 ${detectingLocation ? 'animate-spin text-amber-300' : 'text-emerald-100'}`} />
        <span>{detectingLocation ? 'Locating...' : '📍 Live GPS'}</span>
      </button>

      {loadingForecast && <span className="text-[10px] text-cyan-400 animate-pulse ml-1 shrink-0">● live</span>}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-3 sm:px-6 gap-2 min-w-0 w-full">

        {/* Left: MoES / NCMRWF Brand Identity & Mobile Hamburger Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition cursor-pointer"
            title="Toggle Menu"
          >
            {isMobileSidebarOpen ? <X className="h-5 w-5 text-sky-400" /> : <Menu className="h-5 w-5 text-sky-400" />}
          </button>

          <div
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-700 shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <CloudRain className="h-6 w-6 text-white animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  MoES <span className="text-sky-400">•</span> NCMRWF
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-[180px] sm:max-w-none">
                Hyperlocal Monsoon Onset & Break Intelligence System
              </p>
            </div>
          </div>
        </div>

        {/* Center: Hyperlocal Location Cascader (desktop) */}
        {renderLocationSelects(false)}

        {/* Right: Mode Switcher, Language & Auth Button (ALWAYS VISIBLE & UNCLIPPED) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto z-10">

          {/* Toggle between Officer Command Center and Farmer Mode */}
          {activeTab === 'farmer-mode' ? (
            <button
              onClick={() => setActiveTab('command-center')}
              className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md shadow-sky-600/20 transition-all cursor-pointer shrink-0"
            >
              <Activity className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Officer Command Center</span>
              <span className="sm:hidden">Officer Mode</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('farmer-mode')}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
            >
              <Sprout className="h-3.5 w-3.5 text-amber-200" />
              <span>🌾 Farmer Mode</span>
            </button>
          )}

          {/* Language Selector */}
          <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs shrink-0">
            <button
              onClick={() => setFarmerLanguage('en')}
              className={`px-2 py-1 rounded font-medium transition-colors ${farmerLanguage === 'en' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
            >
              EN
            </button>
            <button
              onClick={() => setFarmerLanguage('hi')}
              className={`px-2 py-1 rounded font-medium transition-colors ${farmerLanguage === 'hi' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setFarmerLanguage('or')}
              className={`px-2 py-1 rounded font-medium font-odia transition-colors ${farmerLanguage === 'or' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
            >
              ଓଡ଼ିଆ
            </button>
          </div>

          {/* Alerts Bell & Interactive Dropdown Menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => {
                setShowNotificationMenu(!showNotificationMenu);
                setShowProfileMenu(false);
              }}
              className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
              title="Active Meteorological Alerts & Notifications"
            >
              <Bell className="h-4 w-4 text-sky-400" />
              {unreadNotificationCount > 0 && (
                <>
                  <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white">
                    {unreadNotificationCount}
                  </span>
                </>
              )}
            </button>

            {/* Notification Dropdown Popover List */}
            {showNotificationMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl space-y-2 text-xs z-50 animate-in fade-in slide-in-from-top-2 duration-150 p-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Bell className="h-4 w-4 text-sky-400" />
                    <span>Alerts & Notifications</span>
                    {unreadNotificationCount > 0 && (
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded-full font-mono border border-rose-500/30">
                        {unreadNotificationCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={triggerTestNotification}
                      className="text-[10px] bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 font-bold px-2 py-0.5 rounded-md border border-sky-500/40 transition cursor-pointer"
                      title="Trigger test push notification & chime sound"
                    >
                      + Test Alert
                    </button>
                    {unreadNotificationCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-[10px] text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
                      >
                        Mark read
                      </button>
                    )}
                    {notificationsList.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-[10px] text-slate-400 hover:text-slate-200 font-semibold cursor-pointer"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {notificationsList.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 font-medium">
                      No notifications right now.
                      <button
                        onClick={triggerTestNotification}
                        className="block mx-auto mt-2 text-sky-400 text-xs font-bold hover:underline cursor-pointer"
                      >
                        Click to send a test alert
                      </button>
                    </div>
                  ) : (
                    notificationsList.map(n => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-xl border transition-all relative group ${
                          n.unread
                            ? 'bg-slate-800/90 border-slate-700 text-slate-200'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-xs text-white flex items-center gap-1.5 pr-4">
                            {n.unread && <span className="h-2 w-2 rounded-full bg-sky-400 shrink-0" />}
                            <span className={n.type === 'HEAVY_RAIN' ? 'text-rose-300' : n.type === 'DRY_SPELL' ? 'text-amber-300' : 'text-sky-300'}>
                              {n.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[9px] text-slate-500 font-mono">{n.time}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (removeNotification) removeNotification(n.id);
                              }}
                              className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition cursor-pointer"
                              title="Delete notification"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed font-medium">
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-slate-800 pt-2 text-center">
                  <button
                    onClick={() => {
                      setActiveTab('notifications');
                      setShowNotificationMenu(false);
                    }}
                    className="w-full text-center text-xs font-bold text-sky-400 hover:text-sky-300 py-1 transition cursor-pointer"
                  >
                    View All Notifications & Broadcast Dispatcher →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Auth State Button */}
          {isLoggedIn ? (
            <div className="relative shrink-0">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-semibold transition-all cursor-pointer shadow-md"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="max-w-[80px] sm:max-w-[120px] truncate">{user.name || user.phoneNumber}</span>
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 p-2 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl space-y-2 text-xs z-50 animate-in fade-in duration-150">
                  <div className="p-2 border-b border-slate-800 space-y-0.5">
                    <div className="font-bold text-white text-sm">{user.name}</div>
                    <div className="text-slate-400 font-mono text-[11px]">+91 {user.phoneNumber}</div>
                    <div className="text-[10px] text-amber-300 font-semibold mt-1">
                      📍 {user.block || selectedBlock} ({user.pincode || '754212'})
                    </div>
                    <div className="text-[10px] text-emerald-300 font-medium">
                      {selectedDistrict} → {selectedBlock} → GP: {selectedPanchayat}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      logoutUserSession();
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/60 font-semibold transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('auth')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all cursor-pointer shrink-0"
            >
              <LogIn className="h-3.5 w-3.5 text-white" />
              <span>Sign In</span>
            </button>
          )}

        </div>

      </div>

      {/* Mobile location bar — visible below header on small/medium screens */}
      <div className="xl:hidden px-3 pb-2 overflow-x-auto">
        {renderLocationSelects(true)}
      </div>

    </header>
  );
};

export default Navbar;
/** Navbar Component - Hyperlocal Location Cascader & Mode Switcher */
