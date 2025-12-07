# SMTP Email Setup Guide

## Overview
The application uses nodemailer with SMTP to send transactional emails. It supports both global SMTP settings (via environment variables) and clinic-specific SMTP settings (via Tenant model).

## Environment Variables

Add these to your `.env.local` or `.env` file:

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@doctorsclinic.services
SMTP_FROM_NAME=Doctor's Clinic
SMTP_REJECT_UNAUTHORIZED=true
```

## Common SMTP Providers

### Gmail
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Use App Password, not regular password
```

**Note:** For Gmail, you need to:
1. Enable 2-factor authentication
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the App Password (16 characters) as `SMTP_PASSWORD`

### Outlook/Office 365
```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

### SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### AWS SES
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
```

### Custom SMTP Server
```bash
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your-password
```

## Clinic-Specific SMTP Settings

Clinics can configure their own SMTP settings in the Tenant model. This allows each clinic to use their own email domain and SMTP server.

### Settings Structure
```javascript
{
  settings: {
    smtp: {
      enabled: true,
      host: "smtp.clinic-domain.com",
      port: 587,
      secure: false,
      user: "noreply@clinic-domain.com",
      password: "encrypted-password",
      fromEmail: "noreply@clinic-domain.com",
      fromName: "Clinic Name",
      rejectUnauthorized: true
    }
  }
}
```

## Email Types Implemented

1. **Password Reset Emails** - Sent when users request password reset
   - Location: `app/api/auth/forgot-password/route.js`
   - Function: `sendPasswordResetEmail()`

2. **Video Consultation Emails** - Sent when video consultations are scheduled
   - Location: `app/api/appointments/route.js`
   - Function: `sendVideoConsultationEmail()`

3. **Video Link Sharing** - Sent when doctor shares video link manually
   - Location: `app/api/telemedicine/sessions/send-link/route.js`
   - Function: `sendEmail()`

## Testing Email Configuration

1. Set up your SMTP environment variables
2. Test by requesting a password reset or creating a video consultation
3. Check server logs for email sending status:
   - `✅ Email sent successfully` - Email was sent
   - `⚠️ SMTP not configured` - SMTP settings missing
   - `❌ Failed to send email` - Error occurred (check error details)

## Troubleshooting

### Emails not sending
1. Check environment variables are set correctly
2. Verify SMTP credentials are correct
3. Check firewall/network allows SMTP connections
4. For Gmail, ensure App Password is used (not regular password)
5. Check server logs for specific error messages

### Authentication errors
- Verify username and password are correct
- For Gmail, ensure "Less secure app access" is enabled OR use App Password
- Check if 2FA is enabled and use App Password

### Connection timeouts
- Verify SMTP_HOST and SMTP_PORT are correct
- Check firewall allows outbound connections on SMTP port
- Try different ports (587 for TLS, 465 for SSL, 25 for unencrypted)

## Security Notes

1. **Never commit SMTP credentials to version control**
2. **Use environment variables for all SMTP settings**
3. **For production, use App Passwords or API keys, not regular passwords**
4. **Enable TLS/SSL encryption (SMTP_SECURE=true for port 465)**
5. **Store clinic-specific SMTP passwords encrypted in database**

## Future Enhancements

- [ ] Appointment reminder emails (24 hours before, 1 hour before)
- [ ] Appointment confirmation emails
- [ ] Invoice/payment receipt emails
- [ ] Prescription ready notifications
- [ ] Lab results notifications
- [ ] Email templates customization per clinic
- [ ] Email delivery tracking and logs
- [ ] Bounce handling and email validation

