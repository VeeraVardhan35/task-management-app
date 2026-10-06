import React from 'react';

export default function TeamList({ workload }) {
  if (!workload || workload.length === 0) {
    return (
      <div className="team-list">
        <h3 className="team-title">👥 Team Workload</h3>
        <p className="no-team">No team members yet</p>
      </div>
    );
  }

  return (
    <div className="team-list">
      <h3 className="team-title">👥 Team Workload</h3>
      <div className="team-members">
        {workload.map((member) => {
          const count = parseInt(member.inprogress_count, 10);
          const isBurntOut = count > 5;
          return (
            <div key={member.id} className="team-member">
              <div
                className={`member-avatar ${isBurntOut ? 'burnout-pulse' : ''}`}
                style={{ background: member.avatar_color || '#6366f1' }}
                title={
                  isBurntOut
                    ? `⚠️ ${member.name} has ${count} tasks in progress — potential burnout!`
                    : `${member.name} — ${count} tasks in progress`
                }
              >
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="member-info">
                <span className="member-name">{member.name}</span>
                <span className={`member-tasks ${isBurntOut ? 'text-danger' : ''}`}>
                  {count} in progress {isBurntOut && '🔥'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="burnout-legend">
        <span className="legend-dot burnout" />
        <small>Avatar pulses red when &gt;5 tasks in progress</small>
      </div>
    </div>
  );
}
