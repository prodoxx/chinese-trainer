# Danbing Documentation

Welcome to the comprehensive documentation for Danbing, the AI-powered Traditional Chinese learning platform. This documentation covers everything from user experience to technical implementation.

## 📁 Documentation Structure

```
docs/
├── overview/           # Product overview and general information
├── user-guides/        # End-user documentation and guides
├── learning-system/    # Learning methodology and science
├── architecture/       # System architecture and design
├── infrastructure/     # Services, integrations, and storage
├── api/               # API reference and documentation
├── technical/         # Developer guides and technical details
└── README.md          # This file
```

## 📚 Table of Contents

### 🎯 Overview
- **[About Danbing](./overview/about.md)** - Complete product overview, features, and roadmap

### 📖 User Guides
- **[Flash Session User Guide](./user-guides/FLASH_SESSION_USER_GUIDE.md)** - Complete guide for using flash sessions
- **[User Onboarding Journey](./user-guides/USER_ONBOARDING_JOURNEY.md)** - Step-by-step user experience from signup to habit formation
- **[Character Insights Guide](./user-guides/CHARACTER_INSIGHTS_GUIDE.md)** - AI-powered character analysis modal documentation

### 🧠 Learning System
- **[Flash Session Flow](./learning-system/FLASH_SESSION_FLOW.md)** - Detailed flow of the 8-character session system with mini-quizzes
- **[Flash Session Science](./learning-system/flash-session-science.md)** - Scientific research behind the learning methodology
- **[Analytics & Spaced Repetition](./learning-system/ANALYTICS_AND_SPACED_REPETITION.md)** - SM-2 algorithm and learning analytics
- **[Learning Methodology](./learning-system/learning-methodology.md)** - Educational philosophy and approach
- **[Mnemonic System](./learning-system/MNEMONIC_SYSTEM.md)** - Memory aid generation and implementation
- **[Flash Timing Reference](./learning-system/FLASH_TIMING_REFERENCE.md)** - Technical timing specifications
- **[Flash Session Diagram](./learning-system/FLASH_SESSION_DIAGRAM.txt)** - ASCII flow diagrams

### 🏗️ Architecture
- **[Component Architecture](./architecture/COMPONENT_ARCHITECTURE.md)** - React component structure and design patterns
- **[User Accounts Architecture](./architecture/USER_ACCOUNTS_ARCHITECTURE.md)** - NextAuth.js authentication and user management

### 🔧 Infrastructure
- **[AI Integration Guide](./infrastructure/AI_INTEGRATION_GUIDE.md)** - OpenAI integration throughout the system
- **[AI Image Validation](./infrastructure/AI_IMAGE_VALIDATION.md)** - Automatic detection and correction of AI-generated image artifacts
- **[Cloudflare R2 Integration](./infrastructure/CLOUDFLARE_R2_INTEGRATION.md)** - Media storage system with 94% cost reduction
- **[Email System](./infrastructure/EMAIL_SYSTEM.md)** - Resend integration and email templates
- **[Shared Media Implementation](./infrastructure/SHARED_MEDIA_IMPLEMENTATION.md)** - Hanzi-based media sharing strategy
- **[Media Sharing Strategy](./infrastructure/MEDIA_SHARING_STRATEGY.md)** - Cost optimization through intelligent sharing
- **[Security & Media Access](./infrastructure/SECURITY_MEDIA_ACCESS.md)** - Secure media delivery and access control

### 🚀 API Reference
- **[API Documentation](./api/API_DOCUMENTATION.md)** - Complete API endpoint reference with examples

### 💻 Technical Documentation
- **[Development Setup](./technical/DEVELOPMENT_SETUP.md)** - Complete guide for setting up the development environment
- **[API Cost Breakdown](./technical/API_COST_BREAKDOWN.md)** - Analysis of external service costs

## 🚀 Quick Start Guides

### For Users
1. **Getting Started**: Read [User Onboarding Journey](./user-guides/USER_ONBOARDING_JOURNEY.md)
2. **Understanding Sessions**: See [Flash Session User Guide](./user-guides/FLASH_SESSION_USER_GUIDE.md)
3. **Character Analysis**: Learn about [Character Insights](./user-guides/CHARACTER_INSIGHTS_GUIDE.md)

### For Developers
1. **Setup Environment**: Start with [Development Setup](./technical/DEVELOPMENT_SETUP.md)
2. **Architecture Overview**: Review [Component Architecture](./architecture/COMPONENT_ARCHITECTURE.md)
3. **API Reference**: Check [API Documentation](./api/API_DOCUMENTATION.md)

### For Product Managers
1. **Product Overview**: Read [About Danbing](./overview/about.md)
2. **User Experience**: Study [User Onboarding Journey](./user-guides/USER_ONBOARDING_JOURNEY.md)
3. **Learning Science**: Explore [Flash Session Science](./learning-system/flash-session-science.md)

## 🔄 Recently Updated

- **[AI Image Validation](./infrastructure/AI_IMAGE_VALIDATION.md)** - NEW: Automatic detection and correction of AI artifacts in generated images
- **[About Danbing](./overview/about.md)** - Updated with 8-character sessions, AI insights, and current tech stack
- **[Flash Session Flow](./learning-system/FLASH_SESSION_FLOW.md)** - Added mini-quizzes every 3 cards and demo system
- **[User Accounts Architecture](./architecture/USER_ACCOUNTS_ARCHITECTURE.md)** - Updated with NextAuth.js and email verification
- **[AI Integration Guide](./infrastructure/AI_INTEGRATION_GUIDE.md)** - Updated with image validation costs and implementation
- **[Cloudflare R2 Integration](./infrastructure/CLOUDFLARE_R2_INTEGRATION.md)** - New media storage system documentation

## 🎯 Key Features Documented

### ✅ Core Learning Features
- **8-Character Flash Sessions** with scientific timing
- **Mini-Quizzes Every 3 Cards** for engagement
- **Dual-Phase Presentation** (visual → multi-modal)
- **AI-Powered Character Insights** with etymology and mnemonics
- **Interactive Demo System** for new users

### ✅ Technical Features
- **NextAuth.js Authentication** with email verification
- **Cloudflare R2 Media Storage** with 94% cost reduction
- **OpenAI Integration** for comprehensive AI analysis
- **AI Image Validation** with automatic artifact detection and retry logic
- **Resend Email System** with branded templates
- **React 19 + Next.js 15.4** architecture

### ✅ User Experience Features
- **Comprehensive Onboarding** with guided tour
- **Character Insights Modal** with AI analysis
- **Progress Tracking** with spaced repetition
- **Cross-Device Sync** with cloud storage
- **Mobile-Responsive Design** across all features

## 📋 Documentation Standards

### Writing Style
- **Clear and concise**: Easy to understand for all audiences
- **Code examples**: Include practical implementation examples
- **Visual diagrams**: ASCII art and flowcharts where helpful
- **Cross-references**: Link to related documentation

### Structure
- **Overview**: Brief description of the topic
- **Key concepts**: Important terminology and principles
- **Implementation**: Technical details and code examples
- **Usage**: How to use or interact with the feature
- **Troubleshooting**: Common issues and solutions

### Maintenance
- **Regular updates**: Keep pace with development changes
- **Version tracking**: Note major changes and dates
- **Feedback integration**: Incorporate user and developer feedback

## 🔍 Search and Navigation

### By Topic
- **Learning System**: Flash sessions, analytics, spaced repetition
- **Authentication**: User accounts, email verification, security
- **AI Features**: Character analysis, insights, cost optimization
- **Infrastructure**: Media storage, email system, performance
- **User Experience**: Onboarding, interface design, accessibility

### By Audience
- **End Users**: Onboarding, session guides, character insights
- **Developers**: Architecture, API docs, component guides
- **Product Team**: User experience, features, analytics
- **Operations**: Cost analysis, performance, monitoring

## 📞 Support and Feedback

### Documentation Issues
- **Missing information**: Open an issue or submit a PR
- **Outdated content**: Flag for updates
- **Unclear explanations**: Request clarification

### Feature Requests
- **New documentation needs**: What would be helpful?
- **Format improvements**: Better diagrams, examples, structure
- **Integration guides**: Connection to external tools

## 🏆 Best Practices

### For Using This Documentation
1. **Start with overview documents** before diving into technical details
2. **Follow cross-references** to understand related concepts
3. **Check "Recently Updated"** for the latest information
4. **Use the search function** to find specific topics quickly

### For Contributing
1. **Follow the established structure** for new documents
2. **Include practical examples** and code snippets
3. **Update cross-references** when adding new content
4. **Test code examples** to ensure they work

---

**Last Updated**: January 2025  
**Version**: 3.2 (AI Image Validation)  
**Platform**: Web (Mobile coming soon)

For questions about this documentation, please contact the development team or create an issue in the repository.