# AI Guessing Game: Who is it?

## Overview
A web-based guessing game where users register 7 people, input their personality traits, and an "AI" (text matching algorithm) identifies a person based on a final description.

## Features
- **Registration Phase:** Input fields for 7 player names.
- **Trait Entry Phase:** Each player provides detailed information about themselves.
- **AI Guessing Phase:** Enter a description and get the most likely match from the registered players.
- **Gemini AI Integration:** Uses the Google Gemini API for deep semantic analysis and accurate personality matching.
- **Modern UI:** Responsive design, smooth transitions, and vibrant aesthetics.

## Technical Details
- **Frontend:** HTML5, CSS3 (Baseline features), Vanilla JavaScript (ES Modules).
- **AI Model:** Google Gemini 1.5 Flash (via `@google/generative-ai`).
- **Matching Algorithm:** Hybrid approach using Gemini API for semantic matching with a keyword-based fallback.
- **Styling:** Cascade layers, container queries (where applicable), logical properties, and modern color spaces (OKLCH).

## Implementation Plan
1. [x] Plan Approval.
2. [x] HTML Structure (Registration, Trait Entry, Guessing Views).
3. [x] CSS Styling (Modern look, responsive, animations).
4. [x] JavaScript Logic (State management, trait storage, matching algorithm).
5. [ ] **AI Integration:** 
    - [ ] Add Gemini API SDK via CDN.
    - [ ] Implement secure API key handling (user input).
    - [ ] Refactor `findBestMatch` to be asynchronous and use Gemini.
    - [ ] Add fallback logic for offline/no-key scenarios.
6. [ ] Verification & Final Polishing.
7. [ ] Deployment (via Git to GitHub Pages).

## Deployment Details
- **Platform:** GitHub Pages
- **Branch:** `gh-pages`
- **URL:** https://pinch-alt.github.io/GuessCharacter/
