import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Receipt, Users, Zap, Shield, TrendingUp, CheckCircle } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            <span className="text-xl font-semibold">ExpenseFlow</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign Up</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-balance">
            Expense Management
            <span className="block text-muted-foreground mt-2">Made Simple</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
            AI-powered OCR receipt scanning, role-based approvals, and automated expense tracking for modern teams.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Everything you need to manage expenses</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="AI-Powered OCR"
              description="Scan receipts instantly with AI. Auto-extract merchant, amount, date, and category."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Role-Based Access"
              description="Separate dashboards for Employees, Managers, and Admins with custom permissions."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Approval Workflows"
              description="Configure sequential, percentage-based, or custom approval rules for your team."
            />
            <FeatureCard
              icon={<TrendingUp className="h-6 w-6" />}
              title="Real-Time Tracking"
              description="Monitor expense status from draft to approval with live updates."
            />
            <FeatureCard
              icon={<CheckCircle className="h-6 w-6" />}
              title="Multi-Currency"
              description="Support for multiple currencies with automatic conversion rates."
            />
            <FeatureCard
              icon={<Receipt className="h-6 w-6" />}
              title="Expense Automation"
              description="Reduce manual data entry by 90% with intelligent receipt parsing."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto bg-card border border-border rounded-lg p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to streamline your expenses?</h2>
          <p className="text-muted-foreground mb-6 text-lg">
            Join teams who save hours every week on expense management.
          </p>
          <Link href="/signup">
            <Button size="lg">Start Free Trial</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              <span className="font-semibold">ExpenseFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2025 ExpenseFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
      <div className="mb-4 text-primary">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
