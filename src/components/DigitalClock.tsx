import React, { useState, useEffect } from 'react';

interface TimeZone {
  label: string;
  offset: string;
  abbreviation: string;
}

interface ClockDisplay {
  zone: TimeZone;
  time: string;
  period?: string;
}

const DigitalClock: React.FC = () => {
  const [clocks, setClocks] = useState<ClockDisplay[]>([]);
  const [is24Hour, setIs24Hour] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Define time zones
  const timeZones: TimeZone[] = [
    { label: 'New York', offset: 'America/New_York', abbreviation: 'EST/EDT' },
    { label: 'London', offset: 'Europe/London', abbreviation: 'GMT/BST' },
    { label: 'Dubai', offset: 'Asia/Dubai', abbreviation: 'GST' },
    { label: 'Tokyo', offset: 'Asia/Tokyo', abbreviation: 'JST' },
    { label: 'Sydney', offset: 'Australia/Sydney', abbreviation: 'AEST/AEDT' },
    { label: 'Oman (Muscat)', offset: 'Asia/Muscat', abbreviation: 'GST' },
  ];

  useEffect(() => {
    setMounted(true);
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [is24Hour]);

  const updateTime = () => {
    const newClocks = timeZones.map((zone) => {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: zone.offset,
        hour: is24Hour ? '2-digit' : '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: !is24Hour,
      });

      const parts = formatter.formatToParts(new Date());
      const timeObj = parts.reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
      }, {} as Record<string, string>);

      const time = is24Hour
        ? `${timeObj.hour}:${timeObj.minute}:${timeObj.second}`
        : `${timeObj.hour}:${timeObj.minute}:${timeObj.second}`;

      return {
        zone,
        time,
        period: timeObj.dayPeriod,
      };
    });

    setClocks(newClocks);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Global Time</h1>
          <p className="text-slate-400">Current time across major cities</p>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIs24Hour(!is24Hour)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          {is24Hour ? '24-Hour' : '12-Hour'} Format
        </button>
      </div>

      {/* Clock Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clocks.map((clock) => (
          <div
            key={clock.zone.offset}
            className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 shadow-lg border border-slate-600 hover:border-blue-500 transition-all duration-200"
          >
            {/* Location */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">{clock.zone.label}</h2>
              <p className="text-sm text-slate-400">{clock.zone.abbreviation}</p>
            </div>

            {/* Time Display */}
            <div className="bg-slate-900 rounded-lg p-4 mb-3 border border-slate-600">
              <div className="font-mono text-5xl font-bold text-blue-400 text-center tracking-wider">
                {clock.time}
              </div>
              {!is24Hour && clock.period && (
                <div className="text-center text-slate-400 text-sm mt-2 uppercase tracking-wider">
                  {clock.period}
                </div>
              )}
            </div>

            {/* Current Date */}
            <div className="text-center text-sm text-slate-400">
              {new Date().toLocaleDateString('en-US', {
                timeZone: clock.zone.offset,
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-8 p-4 bg-slate-700 rounded-lg border border-slate-600">
        <p className="text-slate-300 text-sm text-center">
          ⏰ Time updates every second | Click the format button to switch between 12-hour and 24-hour display
        </p>
      </div>
    </div>
  );
};

export default DigitalClock;
