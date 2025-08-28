# Contributing to Choosy

Thank you for your interest in contributing to Choosy! This project represents significant innovation in group decision-making and event planning technology.

## Important Legal Agreement

**BY CONTRIBUTING TO THIS PROJECT, YOU ACKNOWLEDGE AND AGREE TO THE FOLLOWING TERMS:**

### Contributor License Agreement (CLA)

1. **Perpetual License Grant**: You hereby grant to the project maintainer (rtavarezz) and Choosy a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable license to use, reproduce, modify, display, perform, sublicense, and distribute your contributions and any derivative works thereof.

2. **Copyright Assignment**: While you retain copyright ownership of your contributions, you assign to the maintainer the right to use your contributions under any license, including but not limited to:
   - Open source licenses (MIT, Apache, GPL, etc.)
   - Commercial/proprietary licenses
   - Dual licensing arrangements
   - Future licensing models

3. **Originality and Rights**: You represent and warrant that:
   - Each contribution is your original work or you have sufficient rights to grant the above license
   - Your contributions do not infringe upon any third-party intellectual property rights
   - You have the legal authority to enter into this agreement
   - Your contributions do not violate any employment agreements or other obligations

4. **Patent Grant**: You grant a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable patent license to make, have made, use, offer to sell, sell, import, and otherwise transfer your contributions.

5. **No Warranty**: You provide contributions on an "AS IS" basis, without warranties of any kind.

### Protection Against Code Copying

This agreement specifically protects against:
- Unauthorized copying or reproduction of contributed code
- Reverse engineering and republishing under different licenses
- Commercial use without permission
- Creating competing products using contributed intellectual property

### Future Monetization

This CLA ensures that:
- The project can pursue commercial opportunities
- Revenue models can be implemented without legal complications
- Premium features can be developed using contributed code
- Enterprise licensing is legally protected

## How to Contribute

### Before You Start
- Read this entire document carefully
- Understand that your contribution becomes part of Choosy's intellectual property
- Ensure you have the right to contribute any code you submit

### Development Process

1. **Fork the Repository**
   ```bash
   git fork https://github.com/rtavarezz/choosy
   cd choosy
   ```

2. **Set Up Development Environment**
   ```bash
   # Backend setup
   cd backend
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   
   # Frontend setup  
   cd frontend
   npm install
   ```

3. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Development Guidelines**
   - Follow existing code style and patterns
   - Add comprehensive comments explaining complex logic
   - Ensure optimal time/space complexity
   - Write tests for new features
   - Update documentation as needed

5. **Testing**
   ```bash
   # Backend tests
   cd backend && python run_tests.py
   
   # Frontend tests
   cd frontend && npm test
   ```

6. **Submit Pull Request**
   - Provide detailed description of changes
   - Reference any related issues
   - Ensure all tests pass
   - Include screenshots for UI changes

### Code Standards

- **Backend**: Follow PEP 8, use type hints, comprehensive error handling
- **Frontend**: Use TypeScript, follow React best practices, responsive design
- **Database**: Optimize queries, proper indexing, data validation
- **Security**: No hardcoded secrets, input validation, SQL injection prevention

### What Not to Contribute

- Proprietary recommendation or ranking algorithms (reserved for core team)
- Sensitive data or secrets in PRs
- Code that violates third-party licenses
- Competing product integrations without approval

### Areas Needing Contribution

- Event API integrations (Eventbrite, Ticketmaster, local providers)
- AI recommendation algorithms (with approval)
- Real-time voting optimizations  
- Mobile app development
- Performance monitoring
- Security enhancements

## Code of Conduct

### Our Standards

- **Professional Behavior**: Maintain professionalism in all interactions
- **Respectful Communication**: Be constructive and considerate
- **Quality Focus**: Prioritize code quality and user experience
- **Innovation**: Contribute creative solutions and improvements
- **Confidentiality**: Respect proprietary information and trade secrets

### Unacceptable Behavior

- Copying code to competing projects
- Sharing proprietary algorithms or business logic
- Harassment or discriminatory behavior
- Submitting low-quality or malicious code
- Violating intellectual property rights

## Recognition

Contributors will be recognized in:
- Project documentation
- Release notes
- Public acknowledgments (with permission)
- Professional references (upon request)

## Legal Protection

This project is protected by:
- Copyright law
- Patent applications (where applicable)
- Trade secret protections
- Comprehensive licensing agreements
- Terms of service for end users

## Security

If you find a security vulnerability, please report it privately following our [Security Policy](SECURITY.md).

## Questions?

- Technical questions: Open an issue
- Legal questions: Contact maintainer directly
- Business inquiries: Use official channels
- Security issues: Follow responsible disclosure in SECURITY.md

---

**By submitting a pull request, you acknowledge that you have read, understood, and agree to be bound by these terms.**
