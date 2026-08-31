/** Minimal, inline-styled HTML templates — no external email framework needed for two transactional emails. */

export function verificationEmailHtml(firstName: string, verifyUrl: string): string {
  return `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #2c2416;">
      <h2 style="color: #8a6d3b;">Kingdom Library System</h2>
      <p>Hi ${firstName},</p>
      <p>Thanks for creating an account. Please verify your email address to activate it:</p>
      <p style="margin: 24px 0;">
        <a href="${verifyUrl}" style="background: #b8860b; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email</a>
      </p>
      <p style="font-size: 12px; color: #8a6d3b;">This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
    </div>
  `
}

export function passwordResetEmailHtml(firstName: string, resetUrl: string): string {
  return `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #2c2416;">
      <h2 style="color: #8a6d3b;">Kingdom Library System</h2>
      <p>Hi ${firstName},</p>
      <p>We received a request to reset your password. Click below to choose a new one:</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background: #b8860b; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
      </p>
      <p style="font-size: 12px; color: #8a6d3b;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password will not change.</p>
    </div>
  `
}

function baseEmail(firstName: string, bodyHtml: string, ctaUrl: string, ctaLabel: string): string {
  return `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #2c2416;">
      <h2 style="color: #8a6d3b;">Kingdom Library System</h2>
      <p>Hi ${firstName},</p>
      ${bodyHtml}
      <p style="margin: 24px 0;">
        <a href="${ctaUrl}" style="background: #b8860b; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">${ctaLabel}</a>
      </p>
    </div>
  `
}

export function orderPaidEmailHtml(firstName: string, resourceTitle: string, amountRwf: number, orderUrl: string): string {
  return baseEmail(
    firstName,
    `<p>Your payment for <strong>${resourceTitle}</strong> (${amountRwf.toLocaleString('en-RW')} RWF) was successful. Your order is now confirmed.</p>`,
    orderUrl,
    'View Order'
  )
}

export function orderFailedEmailHtml(firstName: string, resourceTitle: string, orderUrl: string): string {
  return baseEmail(
    firstName,
    `<p>Your payment for <strong>${resourceTitle}</strong> could not be completed. No charge was made — you can try again from your order.</p>`,
    orderUrl,
    'Try Again'
  )
}

export function sessionApprovedEmailHtml(firstName: string, courseTitle: string, scheduledAt: string, sessionUrl: string): string {
  return baseEmail(
    firstName,
    `<p>Your session request for <strong>${courseTitle}</strong> has been approved, scheduled for <strong>${scheduledAt}</strong>.</p>`,
    sessionUrl,
    'View Session'
  )
}

export function sessionRejectedEmailHtml(firstName: string, courseTitle: string, sessionUrl: string): string {
  return baseEmail(
    firstName,
    `<p>Your session request for <strong>${courseTitle}</strong> was not approved this time.</p>`,
    sessionUrl,
    'View Details'
  )
}

export function reservationReadyEmailHtml(firstName: string, resourceTitle: string, claimDeadline: string, reservationUrl: string): string {
  return baseEmail(
    firstName,
    `<p>Great news — <strong>${resourceTitle}</strong> is ready for you to claim. Please claim it by <strong>${claimDeadline}</strong> or your reservation will expire.</p>`,
    reservationUrl,
    'Claim Now'
  )
}

export function publicationApprovedEmailHtml(firstName: string, title: string, publicationUrl: string): string {
  return baseEmail(
    firstName,
    `<p>Congratulations — your submission <strong>${title}</strong> has been approved and published to the library catalog.</p>`,
    publicationUrl,
    'View Publication'
  )
}

export function publicationRejectedEmailHtml(firstName: string, title: string, publicationUrl: string): string {
  return baseEmail(
    firstName,
    `<p>Your submission <strong>${title}</strong> was not approved for publishing at this time.</p>`,
    publicationUrl,
    'View Details'
  )
}

export function certificateIssuedEmailHtml(firstName: string, courseTitle: string, certificateUrl: string): string {
  return baseEmail(
    firstName,
    `<p>Congratulations on completing <strong>${courseTitle}</strong>! Your certificate has been issued.</p>`,
    certificateUrl,
    'View Certificate'
  )
}

export function sessionUnavailableEmailHtml(firstName: string, courseTitle: string, sessionUrl: string): string {
  return baseEmail(
    firstName,
    `<p>Your session request for <strong>${courseTitle}</strong> is no longer available.</p>`,
    sessionUrl,
    'View Details'
  )
}

export function sessionReminderEmailHtml(firstName: string, courseTitle: string, scheduledAt: string | null, sessionUrl: string): string {
  return baseEmail(
    firstName,
    `<p>Reminder: your session for <strong>${courseTitle}</strong>${scheduledAt ? ` is scheduled for <strong>${scheduledAt}</strong>` : ' is coming up'}.</p>`,
    sessionUrl,
    'View Session'
  )
}

export function borrowApprovedEmailHtml(firstName: string, resourceTitle: string, dueDate: string, borrowUrl: string): string {
  return baseEmail(
    firstName,
    `<p>Your borrow request for <strong>${resourceTitle}</strong> has been approved. Please return it by <strong>${dueDate}</strong>.</p>`,
    borrowUrl,
    'View Borrowing'
  )
}

export function borrowRejectedEmailHtml(firstName: string, resourceTitle: string, borrowUrl: string): string {
  return baseEmail(
    firstName,
    `<p>Your borrow request for <strong>${resourceTitle}</strong> was not approved this time.</p>`,
    borrowUrl,
    'View Details'
  )
}

export function borrowReturnedEmailHtml(firstName: string, resourceTitle: string, fineAmount: number | null, borrowUrl: string): string {
  return baseEmail(
    firstName,
    `<p>Thanks for returning <strong>${resourceTitle}</strong>.${fineAmount ? ` A fine of <strong>${fineAmount.toLocaleString('en-RW')} RWF</strong> applies for the late return.` : ''}</p>`,
    borrowUrl,
    'View Borrowing'
  )
}

export function reservationCreatedEmailHtml(firstName: string, resourceTitle: string, queuePosition: number, reservationUrl: string): string {
  return baseEmail(
    firstName,
    `<p>Your reservation for <strong>${resourceTitle}</strong> has been placed. You're currently <strong>#${queuePosition}</strong> in the queue — we'll email you once it's ready to claim.</p>`,
    reservationUrl,
    'View Reservation'
  )
}

export function enrollmentConfirmedEmailHtml(firstName: string, courseTitle: string, coursesUrl: string): string {
  return baseEmail(
    firstName,
    `<p>You're enrolled in <strong>${courseTitle}</strong>. Head to your courses to get started.</p>`,
    coursesUrl,
    'Go to My Courses'
  )
}

export function publicationSubmittedEmailHtml(firstName: string, title: string, publicationUrl: string): string {
  return baseEmail(
    firstName,
    `<p>Your submission <strong>${title}</strong> has been received and is now awaiting review.</p>`,
    publicationUrl,
    'View Submission'
  )
}

export function assessmentGradedEmailHtml(firstName: string, assessmentTitle: string, passed: boolean, coursesUrl: string): string {
  return baseEmail(
    firstName,
    `<p>Your assessment <strong>${assessmentTitle}</strong> has been graded — result: <strong>${passed ? 'Passed' : 'Failed'}</strong>.</p>`,
    coursesUrl,
    'View Course'
  )
}
