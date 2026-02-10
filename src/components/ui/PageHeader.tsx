'use client';

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageHeaderProps {
  title?: string;
}

export default function PageHeader({ title }: PageHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-16">
          <Link 
            href="/" 
            className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Home</span>
          </Link>
          {title && (
            <div className="ml-8">
              <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 