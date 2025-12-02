import React from 'react';
import { Button } from './Button';

export interface SubscriptionCardProps {
  name: string;
  description?: string;
  price: number; // in cents
  currency: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  features: string[];
  maxUsers?: number;
  maxPatients?: number;
  maxStorageGB?: number;
  isPopular?: boolean;
  isCurrent?: boolean;
  onSelect?: () => void;
  ctaText?: string;
  ctaDisabled?: boolean;
  className?: string;
}

export function SubscriptionCard({
  name,
  description,
  price,
  currency,
  billingCycle,
  features,
  maxUsers,
  maxPatients,
  maxStorageGB,
  isPopular = false,
  isCurrent = false,
  onSelect,
  ctaText = 'Select Plan',
  ctaDisabled = false,
  className = '',
}: SubscriptionCardProps) {
  const formatPrice = (amount: number, curr: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount / 100);
  };

  const billingPeriod = billingCycle === 'MONTHLY' ? 'month' : 'year';
  const isPaid = price > 0;

  return (
    <div
      className={`relative flex flex-col h-full rounded-2xl border-2 transition-all duration-300 hover:shadow-xl ${
        isPopular
          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-white shadow-lg scale-105'
          : isCurrent
          ? 'border-green-500 bg-gradient-to-br from-green-50 to-white'
          : 'border-gray-200 bg-white hover:border-blue-300'
      } ${className}`}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-1.5 rounded-full text-sm font-semibold shadow-md">
            ⭐ Most Popular
          </div>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrent && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-1.5 rounded-full text-sm font-semibold shadow-md">
            ✓ Current Plan
          </div>
        </div>
      )}

      <div className="p-8 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
          {description && (
            <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
          )}
        </div>

        {/* Price */}
        <div className="mb-8">
          {price === 0 ? (
            <div className="flex items-baseline">
              <span className="text-5xl font-bold text-gray-900">Free</span>
            </div>
          ) : (
            <div className="flex items-baseline">
              <span className="text-5xl font-bold text-gray-900">
                {formatPrice(price, currency)}
              </span>
              <span className="text-gray-600 ml-2 text-lg">
                /{billingPeriod}
              </span>
            </div>
          )}
          {billingCycle === 'YEARLY' && isPaid && (
            <p className="text-sm text-green-600 font-medium mt-2">
              💰 Save 20% with annual billing
            </p>
          )}
        </div>

        {/* Features List */}
        <div className="flex-1 mb-8">
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start group">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5 group-hover:bg-green-200 transition-colors">
                  <svg
                    className="w-3 h-3 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
              </li>
            ))}

            {/* Usage Limits */}
            {maxUsers && (
              <li className="flex items-start group">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                <span className="text-gray-700 text-sm leading-relaxed">
                  <strong className="font-semibold">{maxUsers}</strong> team members
                </span>
              </li>
            )}

            {maxPatients && (
              <li className="flex items-start group">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center mr-3 mt-0.5 group-hover:bg-purple-200 transition-colors">
                  <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 text-sm leading-relaxed">
                  Up to <strong className="font-semibold">{maxPatients.toLocaleString()}</strong> patients
                </span>
              </li>
            )}

            {maxStorageGB && (
              <li className="flex items-start group">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center mr-3 mt-0.5 group-hover:bg-orange-200 transition-colors">
                  <svg className="w-3 h-3 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 text-sm leading-relaxed">
                  <strong className="font-semibold">{maxStorageGB}GB</strong> storage
                </span>
              </li>
            )}
          </ul>
        </div>

        {/* CTA Button */}
        {onSelect && (
          <Button
            variant={isPopular ? 'primary' : isCurrent ? 'outline' : 'outline'}
            className={`w-full ${
              isPopular
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md'
                : isCurrent
                ? 'border-green-500 text-green-600 hover:bg-green-50'
                : 'hover:border-blue-500 hover:text-blue-600'
            }`}
            onClick={onSelect}
            disabled={ctaDisabled}
          >
            {ctaText}
          </Button>
        )}
      </div>
    </div>
  );
}

