type ContactTrainerProps = {
  trainer: {
    email: string;
    phone?: string | null;
    name?: string | null;
  };
};

export function ContactTrainer({ trainer }: ContactTrainerProps) {
  // console.log("ContactTrainerProps", trainer);
  return (
    <div className="trainer-card">
      <div className="trainer-top">
        <div className="trainer-avatar">{trainer.name?.[0]}</div>
        <div className="trainer-info">
          <div className="t-name">{trainer.name}</div>
          <div className="t-role">Your Personal Trainer</div>
        </div>
      </div>

      <div className="contact-btns">
        <a href={`mailto:${trainer.email}`} className="contact-btn">
          <span className="cb-icon">✉️</span> Email
        </a>
        {/* Phone (optional) */}
        {trainer.phone && (
          <a href={`sms:${trainer.phone}`} className="contact-btn">
            <span className="cb-icon">💬</span> Message
          </a>
        )}
      </div>
    </div>
  );
}
