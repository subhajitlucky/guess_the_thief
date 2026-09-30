
import Icon from '../icons/Icon';

/* Which mark belongs to which role. Presentation only — the role string
   still arrives from the server exactly as it always did, and the colour
   is chosen in CSS from the data-role attribute, never in script.
   (GamePage still passes an `emoji` prop; the mark is now drawn as an
   Icon, so the prop is accepted and ignored.) */
const ROLE_MARKS = {
  King: 'crown',
  Queen: 'gem',
  Police: 'shield',
  Thief: 'mask',
};

/* One sharp line per role, set under the description the server sends —
   the difference between knowing your job and knowing your job tonight. */
const ROLE_DIRECTIVES = {
  King: 'Name the police before the thief is found.',
  Queen: 'Steer the police. Nudge — never declare.',
  Police: 'One name. You have sixty seconds.',
  Thief: 'Blend in. Every word you send is evidence.',
};

function RoleCard({ role, description }) {
  return (
    <section className="role-card-section" data-role={role} aria-label="Your role">
      {/* The mark printed oversized behind the type, like a watermark. */}
      <span className="role-card-ghost" aria-hidden="true">
        <Icon name={ROLE_MARKS[role]} size={128} />
      </span>

      <p className="case-label role-card-eyebrow">
        <Icon name="eye-off" size={14} />
        Sealed brief
      </p>

      <div className="role-card-head">
        <span className="role-card-icon">
          <Icon name={ROLE_MARKS[role]} size={40} />
        </span>
        <h2 className="role-name">{role}</h2>
      </div>

      <p className="role-description">{description}</p>
      <p className="role-directive">{ROLE_DIRECTIVES[role]}</p>

      <p className="role-warning">
        <Icon name="lock" size={13} />
        Keep your role secret from the other players.
      </p>
    </section>
  );
}

export default RoleCard;
