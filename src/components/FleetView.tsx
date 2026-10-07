import React, { useState } from 'react';
import { Bus, MapPin, Users, CheckCircle2, Clock, AlertCircle, Plus, Edit2, Trash2, X, PlusCircle } from 'lucide-react';
import { db } from '../services/db';
import { BusRoute } from '../types';

interface FleetViewProps {
  onSimulateScan: (nfcId: string) => void;
  onRefresh?: () => void;
}

export const FleetView: React.FC<FleetViewProps> = ({ onSimulateScan, onRefresh }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<BusRoute | null>(null);

  // Form State
  const [busNumber, setBusNumber] = useState('');
  const [routeName, setRouteName] = useState('');
  const [driverName, setDriverName] = useState('');
  const [capacity, setCapacity] = useState<number>(40);
  const [stops, setStops] = useState<string[]>([]);
  const [newStopInput, setNewStopInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const busStats = db.getBusFleetStats();

  const handleOpenAdd = () => {
    // Generate next default bus name
    const allBuses = db.getAllBusNumbers();
    const numbers = allBuses
      .map((b) => {
        const m = b.match(/BUS-(\d+)/i);
        return m ? parseInt(m[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 3;
    const defaultBusNo = `BUS-${String(nextNum).padStart(2, '0')}`;

    setBusNumber(defaultBusNo);
    setRouteName('');
    setDriverName('');
    setCapacity(40);
    setStops([
      'New Pickup Stop (07:35 AM)',
      'Annapoorana Engineering College (08:30 AM)',
    ]);
    setNewStopInput('');
    setErrorMessage('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (route: BusRoute) => {
    setEditingBus(route);
    setBusNumber(route.busNumber);
    setRouteName(route.routeName);
    setDriverName(route.driverName);
    setCapacity(route.capacity || 40);
    setStops(route.stops && route.stops.length > 0 ? [...route.stops] : ['Campus Gate']);
    setNewStopInput('');
    setErrorMessage('');
  };

  const handleAddStop = () => {
    if (newStopInput.trim()) {
      setStops([...stops, newStopInput.trim()]);
      setNewStopInput('');
    }
  };

  const handleRemoveStop = (index: number) => {
    if (stops.length <= 1) {
      alert('A bus route must have at least one stop.');
      return;
    }
    setStops(stops.filter((_, i) => i !== index));
  };

  const handleSaveBus = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!busNumber.trim()) {
      setErrorMessage('Bus Number is required.');
      return;
    }

    const payload: BusRoute = {
      busNumber: busNumber.trim().toUpperCase(),
      routeName: routeName.trim() || `${busNumber.trim().toUpperCase()} Route`,
      driverName: driverName.trim() || 'Assigned Driver',
      capacity: Number(capacity) || 40,
      stops: stops.length > 0 ? stops : ['Annapoorana Engineering College'],
    };

    if (editingBus) {
      const res = db.updateBusRoute(editingBus.busNumber, payload);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to update bus route');
        return;
      }
      setEditingBus(null);
    } else {
      const res = db.addBusRoute(payload);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to add bus route');
        return;
      }
      setIsAddModalOpen(false);
    }

    if (onRefresh) onRefresh();
  };

  const handleDeleteBus = (busNo: string) => {
    if (confirm(`Are you sure you want to delete bus ${busNo}?`)) {
      const res = db.deleteBusRoute(busNo);
      if (!res.success) {
        alert(res.error || 'Failed to delete bus');
        return;
      }
      if (onRefresh) onRefresh();
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>🚍 Bus Fleet & Route Manifest</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage buses, edit driver schedules, waypoints, and monitor live passenger capacity
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Bus</span>
        </button>
      </div>

      {/* Grid of Buses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {busStats.map((bus) => {
          const routeInfo = bus.routeInfo;
          const assignedCount = bus.totalAssigned;
          const capacityVal = routeInfo.capacity || 40;
          const occupancyPercent = Math.min(100, Math.round((assignedCount / capacityVal) * 100));

          return (
            <div
              key={bus.busNumber}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      <Bus className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-xl font-bold text-slate-900">{bus.busNumber}</h2>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {capacityVal} Seats
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{routeInfo.routeName}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleOpenEdit(routeInfo)}
                      className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-slate-200 hover:border-blue-300"
                      title={`Edit ${bus.busNumber} & Routes`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBus(bus.busNumber)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-slate-200 hover:border-red-300"
                      title={`Delete ${bus.busNumber}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Driver Tag & Capacity Meter */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    👤 Driver: {routeInfo.driverName}
                  </span>
                  <span className="text-slate-500 font-medium">
                    {assignedCount} / {capacityVal} seats filled ({occupancyPercent}%)
                  </span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2 mb-5 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      occupancyPercent >= 90
                        ? 'bg-red-500'
                        : occupancyPercent >= 70
                        ? 'bg-amber-500'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${occupancyPercent}%` }}
                  />
                </div>

                {/* Capacity & Live Counters */}
                <div className="grid grid-cols-3 gap-2.5 mb-5 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Assigned</span>
                    <span className="font-bold text-slate-900 text-lg">{assignedCount}</span>
                  </div>
                  <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                    <span className="text-[10px] text-amber-600 uppercase font-semibold block">Onboard</span>
                    <span className="font-bold text-amber-700 text-lg">{bus.boardedToday}</span>
                  </div>
                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-emerald-600 uppercase font-semibold block">Dropped</span>
                    <span className="font-bold text-emerald-700 text-lg">{bus.completedToday}</span>
                  </div>
                </div>

                {/* Route stops timeline */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      Route Waypoints ({routeInfo.stops?.length || 0})
                    </h3>
                    <button
                      onClick={() => handleOpenEdit(routeInfo)}
                      className="text-[11px] text-blue-600 hover:underline font-medium"
                    >
                      Edit Stops
                    </button>
                  </div>

                  <div className="relative pl-6 space-y-2.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-200">
                    {routeInfo.stops && routeInfo.stops.length > 0 ? (
                      routeInfo.stops.map((stop, i) => (
                        <div key={i} className="relative flex items-center text-xs">
                          <span
                            className={`absolute -left-6 w-3 h-3 rounded-full border-2 border-white ${
                              i === routeInfo.stops.length - 1 ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}
                          />
                          <span
                            className={`font-medium ${
                              i === routeInfo.stops.length - 1
                                ? 'text-emerald-700 font-bold'
                                : 'text-slate-700'
                            }`}
                          >
                            {stop}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400 italic">No stops configured yet.</div>
                    )}
                  </div>
                </div>

                {/* Assigned Passengers Manifest */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                    <span>Passenger Roster ({bus.students.length})</span>
                    <span className="text-[11px] text-slate-400 font-normal">Click to tap card</span>
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {bus.students.length > 0 ? (
                      bus.students.map((student) => (
                        <div
                          key={student.student_id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/60 text-xs transition-colors"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">{student.name}</span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {student.register_no} • {student.pickup_at}
                            </span>
                          </div>
                          <button
                            onClick={() => onSimulateScan(student.nfc_id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:border-blue-400 text-blue-600 shadow-xs cursor-pointer"
                          >
                            {student.nfc_id}
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        No students assigned to {bus.busNumber} yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Bus Modal */}
      {(isAddModalOpen || editingBus) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingBus ? `Edit Bus (${editingBus.busNumber})` : 'Add New Bus'}
                  </h2>
                  <p className="text-xs text-slate-500">Configure vehicle identifier, capacity, and route stops</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingBus(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSaveBus} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Bus Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BUS-03"
                    value={busNumber}
                    onChange={(e) => setBusNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Bus Seat Capacity</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Route Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Omalur & Junction Route"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Driver Name & Details</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karthik (Driver #09)"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Stops Builder */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Route Waypoints / Stops ({stops.length})
                </label>
                <div className="space-y-2 mb-2 max-h-40 overflow-y-auto pr-1">
                  {stops.map((stop, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-slate-800">{stop}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStop(idx)}
                        className="text-slate-400 hover:text-red-600 p-1"
                        title="Remove stop"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new stop input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a new stop (e.g. Omalur Stand - 07:45 AM)"
                    value={newStopInput}
                    onChange={(e) => setNewStopInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddStop();
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddStop}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Stop</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingBus(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  {editingBus ? 'Save Changes' : 'Create Bus & Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
