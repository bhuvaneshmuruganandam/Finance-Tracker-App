# Personal Finance Visualizer

A comprehensive web application for tracking personal finances, built with React, TypeScript, Express.js, and modern UI components.

## Features

### Stage 1: Basic Transaction Tracking ✅
- Add/Edit/Delete transactions (amount, date, description)
- Transaction list view with filtering and search
- Monthly expenses bar chart
- Form validation with Zod

### Stage 2: Categories ✅
- Predefined expense/income categories
- Category-wise pie chart visualization
- Dashboard with summary cards:
  - Total balance
  - Monthly expenses
  - Monthly income
  - Savings rate
- Recent transactions display

### Stage 3: Budgeting ✅
- Set monthly category budgets
- Budget vs actual comparison chart
- Budget progress tracking
- Spending insights and analytics

## Additional Features

- **Responsive Design**: Mobile-friendly interface with collapsible navigation
- **Data Export**: CSV export functionality for transactions
- **Interactive Charts**: Multiple chart types using Recharts
- **Real-time Updates**: Automatic data refresh after changes
- **Error Handling**: Comprehensive error states and user feedback
- **TypeScript**: Fully typed codebase for better development experience

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** components (Radix UI based)
- **TanStack Query** for server state management
- **Wouter** for lightweight routing
- **React Hook Form** with Zod validation
- **Recharts** for data visualization
- **Vite** for build tooling

### Backend
- **Express.js** with TypeScript
- **MongoDB** for persistent storage (with in-memory fallback)
- **Zod** for API validation
- **CORS** enabled for development

## Installation

1. Extract the tar file:
```bash
tar -xzf finance-tracker.tar.gz
cd finance-tracker
```

2. Install dependencies:
```bash
npm install
```

3. **Configure MongoDB (Optional):**
   - For persistent storage, set up MongoDB connection
   - See [MONGODB_SETUP.md](MONGODB_SETUP.md) for detailed instructions
   - Quick setup: `export MONGODB_URI="mongodb://localhost:27017/finance_tracker"`
   - Without MongoDB, the app uses in-memory storage

4. Start the development server:
```bash
npm run dev
```

**Windows Users**: If you get "'NODE_ENV' is not recognized", see [WINDOWS_SETUP.md](WINDOWS_SETUP.md) for platform-specific instructions.

The application will be available at `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes (if using database)

## Project Structure

```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utility functions
├── server/           # Express backend
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Data access layer
│   └── vite.ts       # Vite development server integration
├── shared/           # Shared code between frontend and backend
│   └── schema.ts     # Database schema and validation
└── components.json   # shadcn/ui configuration
```

## API Endpoints

- `GET/POST /api/categories` - Category management
- `GET/POST/PUT/DELETE /api/transactions` - Transaction CRUD
- `GET/POST/PUT/DELETE /api/budgets` - Budget management
- `GET /api/analytics/*` - Analytics and summary data

## Usage

1. **Dashboard**: View financial overview with balance, income, expenses, and savings rate
2. **Transactions**: Add, edit, delete, and filter financial transactions
3. **Analytics**: View charts showing spending patterns and trends
4. **Budgets**: Set monthly budgets and track spending against limits

## Features Demo

- Click navigation items to scroll to different sections
- Add transactions using the "Add Transaction" button
- Filter transactions by category or search by description
- Create budgets and monitor spending progress
- Export transaction data to CSV

## Deployment

The application is ready for deployment to platforms like:
- Replit Deployments
- Vercel
- Netlify
- Railway
- Heroku

For production deployment, ensure to:
1. Set `NODE_ENV=production`
2. Configure MongoDB connection with `MONGODB_URI`
3. Set up proper CORS policies
4. Configure environment variables
5. Use MongoDB Atlas or a managed database service for reliability

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.