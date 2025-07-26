# Enzyme Assay Analyzer

A production-ready, browser-based application for analyzing enzyme reaction kinetics from 96-well plate reader data.

## Features

- **Three Assay Types**: T2943, S2251, and HoFF with specific algorithms
- **Real-time Data Processing**: Paste CSV or upload Excel data and get instant results
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
2. **Paste or Upload Data**: Paste CSV data or upload Excel (xlsx/xls) files in the same format
3. **Select Wells**: Use the well selector to choose wells for analysis
4. **Configure Controls**: For S2251 and HoFF, select control wells
5. **Set Parameters**: Adjust time range and smoothing window
6. **Calculate**: Click calculate to run the analysis
7. **View Results**: See the calculated metrics for each well
8. **Visualize Data**: View time series plots for all wells
9. **Export Results**: Download results in CSV or XLSX format

### Sample Data

Sample CSV files are included for testing:
- `public/sample-data.csv` - Original format with time headers
- `public/sample-data-new-format.csv` - New format without time headers (supports A01/A1 formats)

You can copy and paste either data to see the application in action.

## Data Format

The application expects CSV or Excel data with:
Excel files (`.xlsx` or `.xls`) should contain the same columns as the CSV format.
- First column: Well ID (supports both A1-H12 and A01-H12 formats)
- Subsequent columns: Measurement values (no time column needed)
- Number of data points must match the time range setting
- Time points are automatically generated based on "Time Range (minutes)" setting

**Time Range Setting**: 
- Set the start and end time in minutes (e.g., 0 to 29 minutes = 30 data points)
- Data points are sampled at 1-minute intervals

**Well ID Formats**:
- Standard format: A1, A2, ..., H12
- Alternative format: A01, A02, ..., H12 (automatically converted to standard format)

Example (for 0-29 minute range, 30 data points):
```csv
A01,0.123,0.234,0.345,0.456,0.567,0.678,0.789,0.890,0.901,1.012,1.123,1.234,1.345,1.456,1.567,1.678,1.789,1.890,1.901,2.012,2.123,2.234,2.345,2.456,2.567,2.678,2.789,2.890,2.901,3.012
A1,0.234,0.345,0.456,0.567,0.678,0.789,0.890,0.901,1.012,1.123,1.234,1.345,1.456,1.567,1.678,1.789,1.890,1.901,2.012,2.123,2.234,2.345,2.456,2.567,2.678,2.789,2.890,2.901,3.012,3.123
B1,0.345,0.456,0.567,0.678,0.789,0.890,0.901,1.012,1.123,1.234,1.345,1.456,1.567,1.678,1.789,1.890,1.901,2.012,2.123,2.234,2.345,2.456,2.567,2.678,2.789,2.890,2.901,3.012,3.123,3.234
...
H12,0.567,0.678,0.789,0.890,0.901,1.012,1.123,1.234,1.345,1.456,1.567,1.678,1.789,1.890,1.901,2.012,2.123,2.234,2.345,2.456,2.567,2.678,2.789,2.890,2.901,3.012,3.123,3.234,3.345,3.456
```

**Note**: The application automatically validates that the number of data points matches your time range setting.

### File Handling

Uploaded Excel files are read directly in the browser. They are converted to CSV text and processed entirely in memory, so no data is saved or uploaded. For small files (under 1 MB) you do not need any external storage.

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
