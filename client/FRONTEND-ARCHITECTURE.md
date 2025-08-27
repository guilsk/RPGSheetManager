# Frontend Architecture - RPG Sheet Manager

This project follows the **Feature-Sliced Design (FSD)** methodology for organizing Angular code.

## Project Structure

```
src/app/
├── app.component.ts          # Root application component
├── app.config.ts             # Global Angular configuration
├── app.routes.ts             # Route configuration
├── index.ts                  # Barrel exports
│
├── shared/                   # 🔄 Shared code across layers
│   ├── api/                  # API services and interceptors
│   ├── guards/
│   │   └── auth.guard.ts     # Authentication guard
│   └── ui/
│       └── layout/           # Main layout components
│           ├── layout.component.ts
│           ├── layout.component.html
│           └── layout.component.scss
│
├── entities/                 # 📊 Business entities
│   ├── character/
│   │   └── models/
│   │       └── character.model.ts
│   ├── system/
│   │   └── models/
│   │       └── system.model.ts
│   ├── campaign/
│   │   └── models/
│   │       └── campaign.model.ts
│   └── user/
│       └── models/
│           └── user.model.ts
│
├── features/                 # 🔧 Reusable features (future implementation)
│
└── pages/                    # 📄 Application pages
    ├── characters/
    │   ├── characters.component.ts
    │   ├── characters.component.html
    │   └── characters.component.scss
    ├── systems/
    │   ├── systems.component.ts
    │   ├── systems.component.html
    │   └── systems.component.scss
    └── campaigns/
        ├── campaigns.component.ts
        ├── campaigns.component.html
        └── campaigns.component.scss
```

## FSD Layers

### 1. **App Layer** (`app/`)
Global application configurations, providers, and initial setup.

### 2. **Pages Layer** (`pages/`)
Page components that represent specific routes:
- `characters/` - Character management
- `systems/` - RPG systems management
- `campaigns/` - Campaign management

### 3. **Features Layer** (`features/`) - *Future Implementation*
Complex and reusable features to be implemented as needed.

### 4. **Entities Layer** (`entities/`)
Data models and business logic:
- `character/` - Character and CharacterAttribute entities
- `system/` - RpgSystem and AttributeSchema entities
- `campaign/` - Campaign and CampaignPlayer entities
- `user/` - User entity and authentication models

### 5. **Shared Layer** (`shared/`)
Code shared across all layers:
- `api/` - HTTP services and interceptors
- `guards/` - Route guards (auth.guard.ts)
- `ui/` - Reusable UI components (layout)

## Route Configuration

- `/` → Redirects to `/characters`
- `/characters` → Characters page (protected)
- `/systems` → Systems page (protected)
- `/campaigns` → Campaigns page (protected)

All routes are protected by `authGuard` which redirects to login if not authenticated.

## Implementation Status

### ✅ Implemented Features
- [x] Responsive layout with navigation
- [x] Auth0 authentication integration
- [x] Route protection guards
- [x] Three main pages with consistent design
- [x] Structured data models
- [x] Global styles and design system

### 🔄 Next Steps
- [ ] Implement services for each entity
- [ ] Add CRUD forms and functionality
- [ ] Implement global state management (NgRx or signals)
- [ ] Add unit and integration tests
- [ ] Implement lazy loading for features
- [ ] Add comprehensive error handling
- [ ] Implement form validation
- [ ] Add data persistence integration

## Development Setup

```bash
# Install dependencies
npm install

# Run development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Run linting
npm run lint
```

## Technology Stack

- **Angular 19** - Main framework
- **Auth0** - Authentication service
- **SCSS** - Styling preprocessor
- **TypeScript** - Programming language
- **RxJS** - Reactive programming

## Benefits of FSD Architecture

1. **Scalability** - Easy to add new features without affecting existing code
2. **Maintainability** - Well-organized code separated by responsibilities
3. **Reusability** - Components and services easily reusable across the application
4. **Testability** - Structure facilitates unit and integration testing
5. **Team Collaboration** - Teams can work in parallel on different layers
6. **Code Clarity** - Clear separation of concerns and dependencies

## Contribution Guidelines

When adding new features or components, please follow the FSD structure:

1. **Business entities** go in `entities/`
2. **Reusable features** go in `features/`
3. **Page components** go in `pages/`
4. **Shared utilities** go in `shared/`

Each layer should only depend on layers below it in the hierarchy:
`pages` → `features` → `entities` → `shared`
