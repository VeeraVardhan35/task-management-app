import React from 'react';

const BURNOUT_THRESHOLD = 5;

export default function TeamList({ workload, projectName }) {
  const hasMembers = workload && workload.length > 0;
  const burnoutCount = workload?.filter(m => parseInt(m.inprogress_count) > BURNOUT_THRESHOLD).length || 0;

  return (
    <div className="team-list">
      <div className="team-header">
        <h3 className="team-title">👥 Team Workload</h3>
        {burnoutCount > 0 && (
          <span className="burnout-warning-badge" title="Some members may be overloaded!">
            🔥 {burnoutCount} overloaded
          </span>
        )}
      </div>

      {projectName && (
        <p className="team-project-name">{projectName}</p>
      )}

      {!hasMembers ? (
        <p className="no-team">No members in this project yet. Use "Add User" to add team members.</p>
      ) : (
        <>
          <div className="team-members">
            {workload.map((member) => {
              const count = parseInt(member.inprogress_count, 10);
              const isBurntOut = count > BURNOUT_THRESHOLD;
              return (
                <div key={member.id} className={`team-member ${isBurntOut ? 'member-burnout' : ''}`}>
                  {/* Avatar — pulses red when >5 in-progress tasks */}
                  <div
                    className={`member-avatar ${isBurntOut ? 'burnout-pulse' : ''}`}
                    style={{ background: isBurntOut ? undefined : (member.avatar_color || '#6366f1') }}
                    title={
                      isBurntOut
                        ? `⚠️ ${member.name} has ${count} tasks In Progress — potential burnout!`
                        : `${member.name} — ${count} task${count !== 1 ? 's' : ''} In Progress`
                    }
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="member-info">
                    <span className="member-name">{member.name}</span>
                    <div className="member-task-bar">
                      <div
                        className={`member-task-fill ${isBurntOut ? 'fill-danger' : count > 3 ? 'fill-warning' : 'fill-ok'}`}
                        style={{ width: `${Math.min((count / 8) * 100, 100)}%` }}
                      />
                    </div>
                    <span className={`member-tasks ${isBurntOut ? 'text-danger' : ''}`}>
                      {count} in progress {isBurntOut ? '🔥 Overloaded!' : count > 3 ? '⚠️' : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="burnout-legend">
            <div className="legend-item">
              <span className="legend-dot burnout-dot" />
              <small>Pulses red when &gt;{BURNOUT_THRESHOLD} in-progress</small>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
