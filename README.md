# Enzyme Assay Analyzer

A production-ready, browser-based application for analyzing enzyme reaction kinetics from 96-well plate reader data.

## Features

- **Three Assay Types**: T2943, S2251, and HoFF with specific algorithms
- **Real-time Data Processing**: Paste CSV data and get instant results
- **Interactive Well Selection**: 96-well plate grid for selecting wells and controls
- **Time Series Visualization**: Sparkline charts for each well
- **Results Table**: Sortable table with summary statistics
- **Export Capabilities**: CSV, XLSX, and raw data export
- **Comprehensive Validation**: Data format and content validation
- **Advanced Algorithms**: Implemented according to scientific specifications

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Testing**: Vitest + Testing Library
- **Code Quality**: ESLint + Prettier + Husky

## Prerequisites

Before running this project, you need to install Node.js. You can install it using:

### macOS (using Homebrew):
```bash
brew install node
```

### Or download from:
https://nodejs.org/

## Getting Started

1. **Install pnpm** (if not already installed):
   ```bash
   npm install -g pnpm
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Start development server**:
   ```bash
   pnpm dev
   ```

4. **Run tests**:
   ```bash
   pnpm test
   ```

5. **Build for production**:
   ```bash
   pnpm build
   ```

## Project Structure

```
src/
 ├─ components/      # UI components (WellGrid, InputPanel, etc.)
 ├─ features/        # Zustand store and hooks
 ├─ utils/           # Algorithm implementations
 ├─ pages/           # Page components
 └─ tests/           # Unit tests
```

## Usage

1. **Select Assay Type**: Choose between T2943, S2251, or HoFF
2. **Paste CSV Data**: Paste your 96-well plate data in CSV format
3. **Select Wells**: Use the well selector to choose wells for analysis
4. **Configure Controls**: For S2251 and HoFF, select control wells
5. **Set Parameters**: Adjust time range and smoothing window
6. **Calculate**: Click calculate to run the analysis
7. **View Results**: See the calculated metrics for each well
8. **Visualize Data**: View time series plots for all wells
9. **Export Results**: Download results in CSV or XLSX format

### Sample Data

A sample CSV file is included at `public/sample-data.csv` for testing. You can copy and paste this data to see the application in action.

## Data Format

The application expects CSV data with:
- First column: Well ID (A1-H12 format)
- Subsequent columns: Time point measurements
- 96 rows total (one per well)

Example:
```csv
Well ID,0min,1min,2min,3min
A1,0.1,0.2,0.3,0.4
A2,0.1,0.2,0.3,0.4
...
H12,0.1,0.2,0.3,0.4
```

## Algorithms

### T2943 - tPA Catalytic Rate
- Calculates maximum catalytic rate from absorbance differences
- Uses moving average smoothing

### S2251 - Plasmin Generation Rate
- Requires 0% control wells
- Calculates generation rate from background-subtracted data

### HoFF Test
- Requires both 0% and 100% control wells
- Supports four metrics: HLT, MLR, TMLR, FI

## Development

### Code Quality
- **Type checking**: `npm run type-check`
- **Linting**: `npm run lint`
- **Formatting**: `npm run format`
- **Test coverage**: `npm run test:coverage`

### Local CI/CD Tools
- **Full validation**: `npm run ci-local` - Run complete CI pipeline locally
- **Quick validation**: `npm run quick-check` - Fast type-check + lint validation
- **Failure analysis**: `npm run last-fail` - Analyze recent failures and provide diagnostics

### Pre-push Validation
The project includes a pre-push hook that automatically runs validation before pushing. If validation fails, the push will be blocked.

To bypass the pre-push check (not recommended):
```bash
git push --no-verify
```

## Testing

The project includes comprehensive unit tests for all algorithms:

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test --watch
```

## Deployment

This application is automatically deployed to GitHub Pages when changes are pushed to the main branch.

## License

MIT
