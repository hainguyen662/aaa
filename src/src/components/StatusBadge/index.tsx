import React from 'react';
import styles from './styles.module.css';

interface StatusBadgeProps {
  status: 'online' | 'warning' | 'offline' | 'maintenance';
  label?: string;
  size?: 'small' | 'medium' | 'large';
}

const statusConfig = {
  online: {
    color: '#22c55e',
    icon: '🟢',
    text: 'Online'
  },
  warning: {
    color: '#f59e0b',
    icon: '🟡',
    text: 'Warning'
  },
  offline: {
    color: '#ef4444',
    icon: '🔴',
    text: 'Offline'
  },
  maintenance: {
    color: '#6366f1',
    icon: '🔧',
    text: 'Maintenance'
  }
};

export default function StatusBadge({ 
  status, 
  label, 
  size = 'medium' 
}: StatusBadgeProps): JSX.Element {
  const config = statusConfig[status];
  
  return (
    <span 
      className={`${styles.statusBadge} ${styles[size]}`}
      style={{ borderColor: config.color }}
    >
      <span className={styles.statusIcon}>{config.icon}</span>
      <span className={styles.statusText}>
        {label || config.text}
      </span>
    </span>
  );
}
