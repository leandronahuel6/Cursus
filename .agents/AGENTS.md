# Cursus — Agent Skills Index

When working on this project, load the relevant skill(s) BEFORE writing any code.

## How to Use

1. Check the trigger column to find skills that match your current task
2. Load the skill by reading the SKILL.md file at the listed path
3. Follow ALL patterns and rules from the loaded skill
4. Multiple skills can apply simultaneously

## Strict Project Rules (Always Mandatory)

- **Architecture & Design (Backend/General):** Rigorously apply SOLID principles, with extreme emphasis on **SRP (Single Responsibility Principle)**. Keep the code DRY and highly decoupled using dependency injection.
- **Design Patterns (GoF):** Whenever you identify a common design problem, apply the appropriate GoF pattern (Strategy, Factory, Repository, Adapter, etc.) instead of writing spaghetti code or nested conditionals.
- **Separation of Concerns (Frontend/Blade):** It is STRICTLY FORBIDDEN to use `<style>` and `<script>` tags inside `.blade.php` files. Views must only contain semantic HTML and Blade directives.
- **Zero Inline Styles & Events:** Do not use `style="..."` attributes or inline events like `onclick="..."` in HTML. All CSS must live in its respective compiled files and JS behavior must be handled via `addEventListener` in separate modular files.
- **Modern CSS:** Maximize the use of CSS variables (Custom Properties) for colors, spacing, and typography instead of hardcoded values, facilitating maintainability, consistent theming, and accessibility.

## Skills

| Skill | Trigger | Path |
|-------|---------|------|
| `a11y-ux-expert` | When writing or modifying Frontend code (HTML, CSS, JS, Blade) to ensure semantic structure, keyboard navigation, and basic WCAG accessibility. | [`skills/a11y-ux-expert/SKILL.md`](skills/a11y-ux-expert/SKILL.md) |
| `design-taste-frontend` | When generating or styling landing pages, portfolios, or frontend views to ensure premium, anti-slop, non-templated visual design. | [`skills/design-taste-frontend/SKILL.md`](skills/design-taste-frontend/SKILL.md) |
| `frontend-performance-expert` | When writing Vanilla JS or CSS architecture to enforce strict BEM, ES6 modules without var, and Core Web Vitals optimization (eager/lazy loading). | [`skills/frontend-performance-expert/SKILL.md`](skills/frontend-performance-expert/SKILL.md) |
| `full-output-enforcement` | When generating long files or components to prevent placeholders, ensure exhaustive code output, and handle token-limit splits cleanly. | [`skills/full-output-enforcement/SKILL.md`](skills/full-output-enforcement/SKILL.md) |
| `laravel-simplifier` | When reviewing or refactoring recently modified PHP/Laravel code to improve clarity, consistency, and readability without altering behavior. | [`skills/laravel-simplifier/SKILL.md`](skills/laravel-simplifier/SKILL.md) |
| `minimalist-ui` | When designing clean, editorial-style interfaces requiring high-contrast typography, warm monochrome palettes, bento grids, and no heavy generic shadows. | [`skills/minimalist-ui/SKILL.md`](skills/minimalist-ui/SKILL.md) |
| `redesign-existing-projects` | When auditing or upgrading an existing UI to replace generic AI design patterns with premium standards without breaking current functionality. | [`skills/redesign-existing-projects/SKILL.md`](skills/redesign-existing-projects/SKILL.md) |
| `team-git-workflow` | When executing Git commands, branching, writing commits, or documenting PHP/JS code with DocBlocks in Spanish. | [`skills/team-git-workflow/SKILL.md`](skills/team-git-workflow/SKILL.md) |
| `refactoring-boy-scout` | When assigned a task to create or modify views (Blade), styles (CSS), or scripts (JS). Ensures zero technical debt and extracts code into a modular structure. | [`skills/refactoring-boy-scout/SKILL.md`](skills/refactoring-boy-scout/SKILL.md) |
