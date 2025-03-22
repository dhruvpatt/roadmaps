

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Brain, Users, Sparkles } from "lucide-react";

/**
 * A simple Button component for demonstration.
 * Adjust classes/logic as needed for your own UI.
 */
function Button({ variant = "default", size = "md", className = "", children, ...props }) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    default: "bg-amber-600 text-white hover:bg-amber-700",
    outline: "border border-amber-600 text-amber-600 hover:bg-amber-50",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
  };

  const variantStyles = variants[variant] || variants.default;
  const sizeStyles = sizes[size] || sizes.md;

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white">
        {/* 
          Replaced "container" with "max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8"
          to allow more width on larger screens
        */}
        <div className="max-w-screen-2xl mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xl font-bold">
              <span className="text-amber-600">Path</span>
              <span className="text-gray-900">ways</span>
            </div>
          </div>
          <nav className="ml-auto flex gap-4 sm:gap-6">
            <Link
              href="#features"
              className="text-sm font-medium text-gray-900 hover:text-amber-600"
            >
              Features
            </Link>
            <Link
              href="#about"
              className="text-sm font-medium text-gray-900 hover:text-amber-600"
            >
              About
            </Link>
            <Link
              href="#research"
              className="text-sm font-medium text-gray-900 hover:text-amber-600"
            >
              Research
            </Link>
          </nav>
          <div className="ml-4 flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-gradient-to-b from-amber-50 to-white">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="max-w-screen-2xl mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter text-gray-900 sm:text-4xl md:text-5xl">
                    Personalized Learning for Every Student
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    AI-powered pathways tailored to individual learning styles, making quality
                    education accessible to all.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/signup">
                    <Button className="px-8">
                      Start Learning
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#how-it-works">
                    <Button variant="outline" className="px-8">
                      How It Works
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <img
                  src="/hero.jpg"
                  alt="Learning Dashboard Preview"
                  className="rounded-lg object-cover shadow-lg"
                  width={600}
                  height={400}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 bg-white">
          <div className="max-w-screen-2xl mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter text-gray-900 sm:text-4xl">
                  Why Choose Pathways?
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform adapts to each learner's unique needs and preferences
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-8 mt-12 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="flex flex-col items-center space-y-2 border border-amber-200 p-6 rounded-lg bg-amber-50">
                <div className="p-3 rounded-full bg-amber-100">
                  <Brain className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Personalized Learning</h3>
                <p className="text-center text-gray-500">
                  AI-powered pathways that adapt to your learning style and pace
                </p>
              </div>
              {/* Feature 2 */}
              <div className="flex flex-col items-center space-y-2 border border-amber-200 p-6 rounded-lg bg-amber-50">
                <div className="p-3 rounded-full bg-amber-100">
                  <BookOpen className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Comprehensive Content</h3>
                <p className="text-center text-gray-500">
                  Structured modules with videos, practice exercises, and assessments
                </p>
              </div>
              {/* Feature 3 */}
              <div className="flex flex-col items-center space-y-2 border border-amber-200 p-6 rounded-lg bg-amber-50">
                <div className="p-3 rounded-full bg-amber-100">
                  <Users className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Classroom Integration</h3>
                <p className="text-center text-gray-500">
                  Tools for teachers to create and manage virtual classrooms
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About / Mission Section */}
        <section id="about" className="w-full py-12 md:py-24 bg-amber-50">
          <div className="max-w-screen-2xl mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tighter text-gray-900 sm:text-4xl mb-4">
                  Our Mission
                </h2>
                <p className="text-gray-500 mb-6">
                  Leveraging AI to create personalized lesson plans, making quality education
                  accessible to all and removing socioeconomic barriers to learning.
                </p>
                <p className="text-gray-500">
                  Our education system is failing to meet students' diverse needs. Research shows
                  personalized learning can boost achievement by 20%, yet traditional models remain
                  one-size-fits-all. This issue is exacerbated for those with learning disabilities,
                  LDA found that 1 in 5 children have attention and learning issues. That's why we
                  built an AI-powered platform that doesn't just teach—it adapts to each learner.
                </p>
              </div>
              <div className="flex justify-center">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
                  <div className="flex items-center mb-4">
                    <Sparkles className="h-6 w-6 text-amber-600 mr-2" />
                    <h3 className="text-xl font-bold text-gray-900">What Makes Us Different</h3>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="rounded-full bg-amber-100 p-1 mr-3 mt-1">
                        <div className="rounded-full bg-amber-600 h-2 w-2"></div>
                      </div>
                      <p className="text-gray-500">
                        Agentic AI workflows that analyze user behavior patterns
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="rounded-full bg-amber-100 p-1 mr-3 mt-1">
                        <div className="rounded-full bg-amber-600 h-2 w-2"></div>
                      </div>
                      <p className="text-gray-500">
                        Adaptive content based on learning preferences
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="rounded-full bg-amber-100 p-1 mr-3 mt-1">
                        <div className="rounded-full bg-amber-600 h-2 w-2"></div>
                      </div>
                      <p className="text-gray-500">
                        Support for diverse learning styles and disabilities
                      </p>
                    </li>
                    <li className="flex items-start">
                      <div className="rounded-full bg-amber-100 p-1 mr-3 mt-1">
                        <div className="rounded-full bg-amber-600 h-2 w-2"></div>
                      </div>
                      <p className="text-gray-500">
                        Real-time feedback for teachers to provide targeted support
                      </p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 md:py-8 bg-gray-900 text-white">
        <div className="max-w-screen-2xl mx-auto flex flex-col items-center justify-between gap-4 md:flex-row px-4 md:px-6">
          <div className="flex items-center gap-1 text-lg font-bold">
            <span className="text-white">Path</span>
            <span>ways</span>
          </div>
          <p className="text-center text-sm md:text-left">© 2025 Pathways. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-white/80 hover:underline">
              Privacy Policy
            </Link>
            <Link href="#" className="text-sm text-white/80 hover:underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
