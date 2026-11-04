import React from 'react';

export default function StatCard({
  title,
  value,
  unit = '',
  icon: Icon,
  subtitle = '',
  accent = 'emerald', // emerald, cyan, amber, purple, rose
  trend = null // { value: '+12%', isPositive: true }
}) {
  return (
    <div className={`stat-card stat-accent-${accent}`}>
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {Icon && (
          <div className="stat-card-icon-wrap">
            <Icon size={20} className="stat-card-icon" />
          </div>
        )}
      </div>

      <div className="stat-card-body">
        <div className="stat-card-value-wrap">
          <span className="stat-card-value">{value}</span>
          {unit && <span className="stat-card-unit">{unit}</span>}
        </div>

        {(subtitle || trend) && (
          <div className="stat-card-footer">
            {trend && (
              <span
                className={`stat-trend ${
                  trend.isPositive ? 'trend-up' : 'trend-down'
                }`}
              >
                {trend.value}
              </span>
            )}
            {subtitle && <span className="stat-subtitle">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
