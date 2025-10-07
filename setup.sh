#!/bin/bash

# Pomofocus Backend Setup Script
echo "🚀 Setting up Pomofocus Backend API..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL client not found. Please install PostgreSQL first."
    echo "   You can install it using: brew install postgresql (macOS) or apt-get install postgresql (Ubuntu)"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo "✅ Prisma client generated successfully"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please update .env file with your database credentials and other settings"
else
    echo "✅ .env file already exists"
fi

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build TypeScript"
    exit 1
fi

echo "✅ TypeScript build completed"

# Run linting
echo "🔍 Running linter..."
npm run lint

if [ $? -ne 0 ]; then
    echo "⚠️  Linting issues found. Please fix them before proceeding."
else
    echo "✅ Linting passed"
fi

# Run tests
echo "🧪 Running tests..."
npm test

if [ $? -ne 0 ]; then
    echo "⚠️  Some tests failed. Please check the test output."
else
    echo "✅ All tests passed"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your database credentials"
echo "2. Create a PostgreSQL database: createdb pomofocus_db"
echo "3. Run database migrations: npm run db:migrate"
echo "4. Seed the database: npm run db:seed"
echo "5. Start the development server: npm run dev"
echo ""
echo "📚 Documentation:"
echo "- API Documentation: API_DOCUMENTATION.md"
echo "- README: README.md"
echo ""
echo "🔗 Useful commands:"
echo "- Start dev server: npm run dev"
echo "- Run tests: npm test"
echo "- Run linting: npm run lint"
echo "- Build for production: npm run build"
echo "- Start production server: npm start"
echo "- Database studio: npm run db:studio"
echo ""
echo "Happy coding! 🚀"
