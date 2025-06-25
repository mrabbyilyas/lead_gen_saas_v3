"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ExternalLink } from "lucide-react";

interface ProfileCardProps {
  className?: string;
}

export function ProfileCard({ className = "" }: ProfileCardProps) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 hidden lg:block ${className}`}>
      <Link
        href="https://www.linkedin.com/in/rabbyilyas/"
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
      >
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 hover:scale-105 hover:bg-white">
          <div className="flex items-center gap-3">
            {/* Profile Avatar */}
            <div className="relative flex-shrink-0">
              <Image
                src="/Photo/Casual 1 1.JPG"
                alt="M Rabby Ilyas"
                width={48}
                height={48}
                className="rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all duration-300"
              />
              {/* Verification Badge */}
              <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 shadow-sm">
                <CheckCircle2 className="h-3 w-3 text-white" />
              </div>
            </div>
            
            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-1">Created by</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
                  M Rabby Ilyas
                </span>
                <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}