# Pathfinder — Product Requirements Document

## Original Problem Statement
Build a landing page for **Pathfinder** — a premium AI-powered sustainable tourism website helping travelers discover personalized, less crowded hiking and nature trails across Greece. Tagline: *Find your trail. Leave no trace.*

Visual style: futuristic, cinematic, premium travel-tech startup. Dark mode, glassmorphism cards, glowing trail lines, interactive Greece map, forest green / midnight black / electric cyan / earth beige palette. Inspired by Airbnb, Apple, National Geographic.

## User Choices (Dec 2025)
- Static landing page only (no real AI backend)
- SVG stylized Greece map with glowing trail lines + clickable pins
- "Start Your Journey" scrolls to AI chat section
- Imagery: Greek mountains

## Architecture
- **Frontend:** React 19, Tailwind, Shadcn/UI primitives, lucide-react icons, recharts (elevation), sonner (toasts)
- **Backend:** FastAPI (default template; no Pathfinder-specific endpoints yet)
- **DB:** MongoDB (unused for current scope)
- Single-page scroll experience at `/`

## Persona
**Mindful traveler (28–45)** seeking authentic, low-impact Greek nature experiences over Instagram clichés. Values local communities, sustainability, AI-assisted personalization.

## Core Sections Implemented (Dec 2025)
1. **Navbar** — sticky, smooth-scroll, mobile hamburger
2. **Hero** — Greek mountain bg, glowing SVG Greece map with 6 trail pins, floating weather/crowd/sustainability badges, dual CTAs, stat strip
3. **Problem** — bento grid: 36M+ tourists, 5%/68% concentration, €2.4B lost revenue, 1,200+ undiscovered trails, crowd vs hidden imagery
4. **How It Works** — 4-step tracing-beam timeline (Intake → Matching → Sustainability → Adaptation)
5. **AI Chat** — Apple-Messages-style mockup, user msg + AI reply + rich trail recommendation card with badges
6. **Itinerary** — recharts elevation profile, 5-stop weather timeline, day plan timeline, packing tips, hidden village + alternative route
7. **Sustainability** — 4 metric cards + low-impact travel tips
8. **Advanced AI** — 3 glass cards (Trail Condition Agent, Photo-to-Trail, Dynamic Adaptation)
9. **Final CTA** — "The future of tourism is not more travelers..." with Find Your Trail button
10. **Footer**

## Quality Status
- Testing iteration 1: **100% critical flows passing**, no console errors, mobile responsive (390px verified), all CTAs scroll correctly, all data-testids present.
- Lint: clean
- Minor non-blocking: Recharts first-paint warning (cosmetic)

## Prioritized Backlog
**P0** — none (MVP complete)
**P1**
- Wire real LLM-powered AI chat (GPT-5.2 / Claude 4.5 via Emergent Universal Key)
- Email capture under final CTA → MongoDB for waitlist
- Animated framer-motion scroll reveals for sections
**P2**
- Lenis smooth momentum scrolling
- Real Mapbox / Leaflet trail layer
- Multi-language (EL/EN)
- Trail detail pages (per-pin route)
- User accounts + saved itineraries
