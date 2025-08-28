# Choosy Security Policy

## Our Commitment to Security

Choosy takes security seriously as we handle user data, location information, and facilitate real-time group interactions. We are committed to protecting our users' privacy and maintaining the integrity of our platform.

## Supported Versions

We actively maintain security for the following versions:

| Version | Supported          | End of Life |
| ------- | ------------------ | ----------- |
| 1.x.x   | :white_check_mark: | TBD         |
| 0.x.x   | :x:                | 2024-12-31  |

## Security Scope

### In Scope
- Authentication and authorization systems
- User data handling and privacy
- API security (rate limiting, input validation)
- Database security and injection vulnerabilities
- Real-time voting system integrity
- Location data protection
- Third-party API integrations
- Session management and token security

### Out of Scope  
- Third-party services (Eventbrite, Ticketmaster APIs)
- User device security
- Social engineering attacks
- Physical security
- DNS/hosting provider issues

## Reporting a Security Vulnerability

### Responsible Disclosure Process

1. **Do NOT** create a public GitHub issue for security vulnerabilities
2. **Do NOT** discuss the vulnerability publicly until it's been addressed
3. **Do NOT** attempt to access data that doesn't belong to you

### How to Report

**Email**: Report to maintainer directly (contact information in profile)
**Response Time**: We aim to acknowledge within 48 hours
**Investigation**: Full investigation within 7 days
**Fix Timeline**: Critical issues patched within 30 days

### Report Format

Please include:

```
**Vulnerability Type**: [e.g., SQL Injection, XSS, Authentication Bypass]
**Affected Component**: [e.g., Voting API, User Authentication]
**Severity**: [Critical/High/Medium/Low]
**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Impact**: [Description of potential impact]
**Proof of Concept**: [Code, screenshots, or detailed explanation]
**Suggested Fix**: [If you have recommendations]
```

### Severity Classification

- **Critical**: Immediate system compromise, data breach risk
- **High**: Significant security impact, user data at risk  
- **Medium**: Limited security impact, requires authentication
- **Low**: Minimal security impact, theoretical vulnerabilities

## Security Measures

### Technical Safeguards
- **Input Validation**: All user inputs are validated and sanitized
- **Rate Limiting**: API endpoints protected against abuse
- **Authentication**: JWT-based secure authentication
- **Database Security**: Parameterized queries prevent SQL injection
- **HTTPS**: All production traffic encrypted in transit
- **CORS Protection**: Proper cross-origin request handling
- **Security Headers**: CSP, XSS protection, and security headers implemented

### Data Protection
- **Location Privacy**: GPS coordinates handled securely
- **User Data**: Minimal data collection with explicit consent
- **Phone Numbers**: Encrypted storage and limited access
- **Voting Privacy**: Anonymous voting with privacy controls
- **Session Security**: Secure session management and timeout

### Infrastructure Security
- **Environment Separation**: Development and production isolation
- **Secret Management**: API keys and secrets properly managed
- **Database Encryption**: Sensitive data encrypted at rest
- **Audit Logging**: Security events logged and monitored
- **Regular Updates**: Dependencies updated regularly

## Security Best Practices for Contributors

### Code Security
- Never commit API keys, passwords, or secrets
- Use environment variables for sensitive configuration
- Validate and sanitize all user inputs
- Follow secure coding practices
- Use parameterized database queries
- Implement proper error handling without information disclosure

### Testing
- Include security testing in your development process
- Test input validation thoroughly
- Verify authentication and authorization controls
- Check for common vulnerabilities (OWASP Top 10)

### Dependencies
- Keep all dependencies up to date
- Monitor for known vulnerabilities in dependencies
- Use tools like `npm audit` or `safety` for vulnerability scanning
- Review dependency changes for security implications

## Bug Bounty and Recognition

While we don't currently have a formal bug bounty program, we:
- Acknowledge security researchers in our security hall of fame
- Provide public recognition for significant discoveries (with permission)
- Consider financial rewards for critical vulnerabilities on a case-by-case basis

## Legal Protection

Security researchers acting in good faith will not face legal action for:
- Reporting vulnerabilities through proper channels
- Testing on their own accounts with minimal impact
- Following responsible disclosure practices
- Not accessing other users' data

## Questions and Contact

For security questions that don't involve vulnerabilities:
- Open a GitHub issue with the `security` label
- Contact the maintainer for sensitive discussions

For general security guidance:
- Review our [CONTRIBUTING.md](CONTRIBUTING.md) for security requirements
- Follow our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for professional behavior

---

**Last Updated**: August 2024  
**Next Review**: December 2024
