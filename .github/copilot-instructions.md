# Copilot Instructions for AI Coding Agents

## Project Overview

Star Wars card games web application built with **TypeScript + React + Fluent UI**. Features three classic Star Wars card games:
- **Corellian Spike Sabacc** (as seen in Solo movie and Galaxy's Edge)
- **Kessel Sabacc** (Ubisoft variant inspired by Spike)
- **Pazaak** (from Knights of the Old Republic)

## Tech Stack & Dependencies

- **Frontend**: React with TypeScript
- **UI Framework**: Microsoft Fluent UI ([react.fluentui.dev](https://react.fluentui.dev/))
- **Multiplayer**: PeerJS for peer-to-peer multiplayer connections
- **Target**: Static web application (no backend required)
- **Local Platform**: Windows 11 with PowerShell

## Architecture Guidelines

- **Game Logic**: Separate card game rules from UI components
- **State Management**: Use React hooks or context for game state
- **Component Structure**: Follow Fluent UI design patterns and accessibility guidelines
- **Card Games**: Each variant should have isolated game logic while sharing common card/deck utilities

## Development Patterns

- Use Fluent UI components consistently (Button, Card, Stack, etc.)
- **NO CUSTOM STYLING**: Use only native Fluent UI components with their default styles - no inline styles, no custom CSS overrides
- Implement responsive design for both desktop and mobile play
- Follow TypeScript strict mode practices
- Structure components by game variant vs. shared utilities
- Rely on Fluent UI's built-in theming and design tokens for consistent appearance

## Key References

- [Fluent UI React Documentation](https://react.fluentui.dev/)
- [Microsoft Fluent UI GitHub](https://github.com/microsoft/fluentui)
- [PeerJS Documentation](https://peerjs.com/docs/#start)
- Sabacc rules: Galaxy's Edge official rules and Ubisoft variant
- Pazaak rules: KOTOR game mechanics

## File Organization (Recommended)

- `/src/games/` - Game-specific logic and components
- `/src/components/` - Shared UI components
- `/src/utils/` - Card deck utilities and game helpers

---
