'use client';

/**
 * Admin (Super Admin) skeleton – 100% layout match to admin overview page.
 * Same DOM structure, tags and classes as admin/page.jsx: Section 1 (8 cards), Section 2 (alerts strip + list card), Section 3 (risk strip).
 */

import { Card } from '@/components/ui/Card';

export function AdminSkeleton() {
  return (
    <div className='admin-page-content' role='status' aria-label='Loading'>
      {/* Section 1: System Overview – exact match: section > title (accent + h2) > p > admin-overview-grid > 8 Card(admin-stat-card--with-icon) */}
      <section className='admin-section' aria-hidden>
        <div className='admin-section__title'>
          <span className='admin-section__accent skeleton rounded flex-shrink-0' aria-hidden />
          <h2 className='admin-section__title-text'>
            <span className='skeleton skeleton-text w-40 h-6 rounded inline-block' aria-hidden />
          </h2>
        </div>
        <p className='text-neutral-600 dark:text-neutral-400 text-sm mb-4'>
          <span
            className='skeleton skeleton-text w-full max-w-md h-4 rounded inline-block'
            aria-hidden
          />
        </p>
        <div className='admin-overview-grid'>
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <div className='admin-stat-card admin-stat-card--with-icon'>
                <div>
                  <p className='admin-stat-card__label'>
                    <span
                      className='skeleton skeleton-text w-24 h-4 rounded inline-block'
                      aria-hidden
                    />
                  </p>
                  <p className='admin-stat-card__value'>
                    <span
                      className='skeleton skeleton-text w-16 h-8 rounded inline-block'
                      aria-hidden
                    />
                  </p>
                </div>
                <div className='admin-stat-card__icon skeleton rounded-lg shrink-0' aria-hidden />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 2: Platform Alerts – exact match: section > title (accent + h2 + Link ml-auto) > admin-pending > grid 5 items > 0..5 Card.admin-alert-list */}
      <section className='admin-section' aria-hidden>
        <div className='admin-section__title'>
          <span className='admin-section__accent skeleton rounded flex-shrink-0' aria-hidden />
          <h2 className='admin-section__title-text'>
            <span className='skeleton skeleton-text w-36 h-6 rounded inline-block' aria-hidden />
          </h2>
          <span className='ml-auto skeleton h-5 w-16 rounded inline-block' aria-hidden />
        </div>
        <div className='admin-pending'>
          <div className='admin-pending-grid'>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className='admin-pending-item pointer-events-none'>
                <span className='admin-pending-item__label'>
                  <span
                    className='skeleton skeleton-text w-32 h-4 rounded inline-block'
                    aria-hidden
                  />
                </span>
                <p className='admin-pending-item__value'>
                  <span className='skeleton h-7 w-12 rounded inline-block' aria-hidden />
                </p>
              </div>
            ))}
          </div>
        </div>
        <Card className='admin-alert-list mt-4'>
          <p className='admin-stat-card__label'>
            <span className='skeleton skeleton-text w-48 h-4 rounded inline-block' aria-hidden />
          </p>
          <ul className='admin-alert-list__items'>
            {[1, 2, 3].map((j) => (
              <li key={j} className='flex items-center justify-between gap-2'>
                <span className='skeleton skeleton-text flex-1 h-6 rounded' aria-hidden />
                <span className='skeleton w-5 h-5 rounded shrink-0' aria-hidden />
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Section 3: Risk Monitoring – exact match: section > title (accent + h2 + Link ml-auto) > admin-pending > grid 4 admin-pending-item--warning */}
      <section className='admin-section' aria-hidden>
        <div className='admin-section__title'>
          <span className='admin-section__accent skeleton rounded flex-shrink-0' aria-hidden />
          <h2 className='admin-section__title-text'>
            <span className='skeleton skeleton-text w-36 h-6 rounded inline-block' aria-hidden />
          </h2>
          <span className='ml-auto skeleton h-5 w-16 rounded inline-block' aria-hidden />
        </div>
        <div className='admin-pending'>
          <div className='admin-pending-grid'>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className='admin-pending-item admin-pending-item--warning pointer-events-none'
              >
                <span className='admin-pending-item__label'>
                  <span
                    className='skeleton skeleton-text w-40 h-4 rounded inline-block'
                    aria-hidden
                  />
                </span>
                <p className='admin-pending-item__value'>
                  <span className='skeleton h-7 w-10 rounded inline-block' aria-hidden />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
