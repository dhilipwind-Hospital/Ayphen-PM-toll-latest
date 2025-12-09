# Phase 1: Backend Email Integration

**Estimated Time:** 2-3 hours  
**Priority:** 🔥 Critical  
**Complexity:** Medium

---

## Overview

Integrate email sending functionality into the existing invitation routes. The email service already exists but needs a new method for project invitations.

---

## Task 1.1: Add Email Method to EmailService

**File:** `/ayphen-jira-backend/src/services/email.service.ts`

### Instructions

Add the following method after line 278 (after `sendDigestEmail` method):

```typescript
/**
 * Send project invitation email
 */
public async sendProjectInvitation(data: {
  to: string;
  projectName: string;
  inviterName: string;
  role: string;
  token: string;
  expiresAt: Date;
}): Promise<void> {
  try {
    const { to, projectName, inviterName, role, token, expiresAt } = data;
    
    const acceptLink = `${process.env.FRONTEND_URL || 'http://localhost:1600'}/accept-invitation/${token}`;
    const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const subject = `${inviterName} invited you to join "${projectName}"`;
    
    const html = this.getInvitationEmailTemplate({
      projectName,
      inviterName,
      role,
      acceptLink,
      expiryDate,
    });
    
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@ayphenjira.com';
    const fromName = process.env.SMTP_FROM_NAME || 'Ayphen Jira';
    
    const info = await this.transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
      text: `
${inviterName} has invited you to join the project "${projectName}" as a ${role}.

Click the link below to accept the invitation:
${acceptLink}

This invitation will expire on ${expiryDate}.

If you didn't expect this invitation, you can safely ignore this email.
      `.trim(),
    });

    console.log(`✅ Invitation email sent to ${to}: ${info.messageId}`);
    
    // In development, log preview URL
    if (process.env.NODE_ENV !== 'production') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('📧 Preview invitation email:', previewUrl);
      }
    }
  } catch (error) {
    console.error('❌ Failed to send invitation email:', error);
    throw new Error('Failed to send invitation email');
  }
}

/**
 * Send invitation reminder
 */
public async sendInvitationReminder(data: {
  to: string;
  projectName: string;
  token: string;
  expiresAt: Date;
}): Promise<void> {
  try {
    const { to, projectName, token, expiresAt } = data;
    
    const acceptLink = `${process.env.FRONTEND_URL || 'http://localhost:1600'}/accept-invitation/${token}`;
    const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const subject = `Reminder: Join "${projectName}" on Ayphen Jira`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0052CC;">📬 Reminder: You've been invited to join "${projectName}"</h2>
        <p>This is a friendly reminder that you have a pending invitation to join this project.</p>
        <p>
          <a href="${acceptLink}" 
             style="background: #0052CC; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            Accept Invitation
          </a>
        </p>
        <p><strong>⏰ This invitation expires on ${expiryDate}</strong></p>
      </div>
    `;
    
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@ayphenjira.com';
    const fromName = process.env.SMTP_FROM_NAME || 'Ayphen Jira';
    
    await this.transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    });
    
    console.log(`✅ Invitation reminder sent to ${to}`);
  } catch (error) {
    console.error('❌ Failed to send invitation reminder:', error);
    throw new Error('Failed to send invitation reminder');
  }
}

/**
 * HTML template for invitation email
 */
private getInvitationEmailTemplate(data: {
  projectName: string;
  inviterName: string;
  role: string;
  acceptLink: string;
  expiryDate: string;
}): string {
  const { projectName, inviterName, role, acceptLink, expiryDate } = data;
  
  const roleDescriptions = {
    admin: `
      <li>Full access to all project features</li>
      <li>Manage team members and permissions</li>
      <li>Configure project settings</li>
    `,
    member: `
      <li>View and edit all issues</li>
      <li>Create and manage tasks</li>
      <li>Collaborate with team members</li>
    `,
    viewer: `
      <li>View all project issues</li>
      <li>Add comments and feedback</li>
      <li>Track project progress</li>
    `
  };
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Invitation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F5F7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #172B4D; font-size: 24px; font-weight: 600;">
                🎉 You've Been Invited!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="color: #5E6C84; font-size: 16px; line-height: 24px; margin: 0 0 20px;">
                <strong style="color: #172B4D;">${inviterName}</strong> has invited you to join the project 
                <strong style="color: #172B4D;">"${projectName}"</strong> as a <strong>${role}</strong>.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${acceptLink}" 
                       style="background: #0052CC; color: white; padding: 14px 32px; text-decoration: none; 
                              border-radius: 4px; display: inline-block; font-weight: 600; font-size: 16px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Role Info -->
              <div style="background: #F4F5F7; padding: 20px; border-radius: 4px; margin: 20px 0;">
                <h3 style="margin: 0 0 12px; color: #172B4D; font-size: 14px; font-weight: 600; text-transform: uppercase;">
                  What you can do as a ${role}:
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #5E6C84;">
                  ${roleDescriptions[role] || roleDescriptions.member}
                </ul>
              </div>
              
              <!-- Expiry Warning -->
              <div style="background: #FFF7E6; border-left: 4px solid #FA8C16; padding: 12px 16px; margin: 20px 0;">
                <p style="margin: 0; color: #5E6C84; font-size: 14px;">
                  <strong style="color: #FA8C16;">⏰ Note:</strong> This invitation will expire on 
                  <strong>${expiryDate}</strong>
                </p>
              </div>
              
              <!-- Alt Link -->
              <p style="color: #8C8C8C; font-size: 12px; margin: 20px 0 0;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${acceptLink}" style="color: #0052CC; word-break: break-all;">${acceptLink}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background: #F4F5F7; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #8C8C8C; font-size: 12px; text-align: center;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
```

### Testing

```bash
# Test the email service
cd ayphen-jira-backend
npm run dev

# In another terminal, test with curl:
curl -X POST http://localhost:8500/api/project-invitations \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your-project-id",
    "email": "test@example.com",
    "role": "member",
    "invitedById": "your-user-id"
  }'

# Check console for Ethereal preview URL
```

---

## Task 1.2: Integrate Email in Invitation Routes

**File:** `/ayphen-jira-backend/src/routes/project-invitations.ts`

### Step 1: Add Import

Add this import at the top of the file (after line 7):

```typescript
import { emailService } from '../services/email.service';
```

### Step 2: Update POST '/' Route

Replace lines 94-96 (the TODO comment) with:

```typescript
// Send invitation email
try {
  const inviter = await userRepo.findOne({ where: { id: invitedById } });
  
  await emailService.sendProjectInvitation({
    to: email,
    projectName: project.name,
    inviterName: inviter?.name || 'A team member',
    role: invitation.role,
    token: invitation.token,
    expiresAt: invitation.expiresAt,
  });
  
  console.log(`✅ Invitation email sent to ${email}`);
} catch (emailError) {
  console.error('⚠️ Failed to send email, but invitation was created:', emailError);
  // Don't fail the request if email fails - invitation is still created
}
```

### Step 3: Update POST '/resend/:id' Route

Replace line 215 (the TODO comment) with:

```typescript
// Resend invitation email
try {
  await emailService.sendProjectInvitation({
    to: invitation.email,
    projectName: invitation.project.name,
    inviterName: invitation.invitedBy.name,
    role: invitation.role,
    token: invitation.token,
    expiresAt: invitation.expiresAt,
  });
  console.log(`✅ Invitation email resent to ${invitation.email}`);
} catch (emailError) {
  console.error('⚠️ Failed to resend email:', emailError);
  return res.status(500).json({ error: 'Failed to send email' });
}
```

---

## Task 1.3: Add Verify Endpoint

**File:** `/ayphen-jira-backend/src/routes/project-invitations.ts`

Add this new route before the `export default router;` line (after line 222):

```typescript
// VERIFY invitation (get details without accepting)
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const invitation = await invitationRepo.findOne({
      where: { token },
      relations: ['project', 'invitedBy'],
    });
    
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    
    // Check if expired
    if (invitation.expiresAt && new Date() > new Date(invitation.expiresAt)) {
      return res.status(400).json({ 
        error: 'Invitation has expired',
        status: 'expired'
      });
    }
    
    // Check if already used
    if (invitation.status !== 'pending') {
      return res.status(400).json({ 
        error: `Invitation has already been ${invitation.status}`,
        status: invitation.status
      });
    }
    
    // Return invitation details (safe to expose)
    res.json({
      id: invitation.id,
      projectId: invitation.projectId,
      projectName: invitation.project?.name,
      email: invitation.email,
      role: invitation.role,
      invitedBy: {
        id: invitation.invitedBy?.id,
        name: invitation.invitedBy?.name,
      },
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    });
  } catch (error: any) {
    console.error('Error verifying invitation:', error);
    res.status(500).json({ error: error.message || 'Failed to verify invitation' });
  }
});
```

---

## Task 1.4: Update Environment Configuration

**File:** `/ayphen-jira-backend/.env`

Add these lines to your `.env` file:

```env
# Email Configuration
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=noreply@ayphenjira.com
SMTP_FROM_NAME=Ayphen Jira

# Frontend URL (for invitation links)
FRONTEND_URL=http://localhost:1600
```

### For Development (Ethereal - Test Email)

The email service will automatically use Ethereal if no SMTP credentials are provided. Ethereal creates fake email accounts for testing.

**No additional setup needed for dev!**

### For Production (Gmail Example)

If you want to use Gmail:

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Update `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=Ayphen Jira
```

### For Production (SendGrid)

If you want to use SendGrid:

1. Sign up at https://sendgrid.com
2. Create API key with "Mail Send" permission
3. Install: `npm install @sendgrid/mail`
4. Update email.service.ts to use SendGrid instead of nodemailer

---

## Testing Checklist

### Test 1: Email Service Method

```bash
# Start backend
cd ayphen-jira-backend
npm run dev
```

Check console for:
```
📧 Email service initialized with Ethereal (test mode)
   User: some-user@ethereal.email
```

### Test 2: Create Invitation

Use Postman or curl:

```bash
curl -X POST http://localhost:8500/api/project-invitations \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "existing-project-id",
    "email": "newuser@example.com",
    "role": "member",
    "invitedById": "existing-user-id"
  }'
```

Expected console output:
```
✅ Invitation email sent to newuser@example.com
📧 Preview invitation email: https://ethereal.email/message/xxxxx
```

### Test 3: View Email

1. Copy the Ethereal preview URL from console
2. Open in browser
3. Verify email looks correct
4. Check invitation link format: `http://localhost:1600/accept-invitation/[token]`

### Test 4: Verify Endpoint

```bash
# Get token from previous response
curl http://localhost:8500/api/project-invitations/verify/[token]
```

Expected response:
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "projectName": "My Project",
  "email": "newuser@example.com",
  "role": "member",
  "invitedBy": {
    "id": "uuid",
    "name": "John Doe"
  },
  "expiresAt": "2025-12-10T...",
  "createdAt": "2025-12-03T..."
}
```

### Test 5: Resend Invitation

```bash
curl -X POST http://localhost:8500/api/project-invitations/resend/[invitation-id]
```

Check console for new Ethereal preview URL.

---

## Troubleshooting

### Issue: "Cannot find module 'nodemailer'"

**Solution:**
```bash
cd ayphen-jira-backend
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### Issue: "FRONTEND_URL is undefined"

**Solution:** Make sure `.env` file has:
```env
FRONTEND_URL=http://localhost:1600
```

Restart the backend server after updating `.env`.

### Issue: Email not sending

**Solution:**
1. Check console for error messages
2. Verify SMTP credentials in `.env`
3. For Gmail, make sure you're using an App Password, not your regular password
4. Check if 2FA is enabled on Gmail account

### Issue: Ethereal preview URL not showing

**Solution:**
1. Make sure `NODE_ENV` is not set to `production`
2. Check if `nodemailer.getTestMessageUrl(info)` returns a value
3. Verify Ethereal service is working: https://ethereal.email

---

## Success Criteria

After completing Phase 1, you should have:

- [x] `sendProjectInvitation()` method in EmailService
- [x] `sendInvitationReminder()` method in EmailService
- [x] Email sending integrated in POST '/' route
- [x] Email sending integrated in POST '/resend/:id' route
- [x] New GET '/verify/:token' endpoint
- [x] Environment variables configured
- [x] Emails visible in Ethereal (dev) or sent via SMTP (prod)
- [x] Beautiful HTML email template
- [x] Invitation links with correct format

---

## Next Steps

Once Phase 1 is complete, move to:
- **Phase 2:** Frontend API Client (30 minutes)
- **Phase 3:** Frontend Components (3-4 hours)

---

**Estimated Time:** 2-3 hours  
**Difficulty:** Medium  
**Dependencies:** None (email service already exists)
